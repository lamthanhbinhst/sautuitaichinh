
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { DEFAULT_JARS } from './constants';
import { getFinancialAdvice } from './services/geminiService';
import type { Jar, AllocatedJar, Income, MonthlyRecord, Expense } from './types';
import { Header } from './components/Header';
import { IntroductionModal } from './components/IntroductionModal';
import { IncomeInput } from './components/IncomeInput';
import { JarsDisplay } from './components/JarsDisplay';
import { Dashboard } from './components/Dashboard';
import { MonthNavigator } from './components/MonthNavigator';
import { MonthlyReport } from './components/MonthlyReport';
import { AddIncomeModal } from './components/AddIncomeModal';
import { AddExpenseModal } from './components/AddExpenseModal';
import { ExpenseList } from './components/ExpenseList';
import { ShareModal } from './components/ShareModal';
import { BackupModal } from './components/BackupModal';


const APP_VERSION = '2302.12';

/**
 * NÉN DỮ LIỆU SIÊU CẤP (Format: Tên|55|10|10|10|10|5)
 */
const encodeCompact = (name: string, jars: Jar[]) => {
    const p = jars.map(j => j.percentage).join('|');
    const data = `${name || 'User'}|${p}`;
    // Base64 an toàn cho Unicode (tiếng Việt)
    return window.btoa(unescape(encodeURIComponent(data)));
};

const decodeCompact = (base64: string) => {
    try {
        const raw = decodeURIComponent(escape(window.atob(base64)));
        const parts = raw.split('|');
        if (parts.length < 7) return null;
        
        const userName = parts[0];
        const jars = DEFAULT_JARS.map((dj, index) => ({
            ...dj,
            percentage: parseInt(parts[index + 1], 10) || dj.percentage
        }));
        
        return { userName, jars };
    } catch (e) {
        return null;
    }
};

const hydrateRecords = (records: any[]): MonthlyRecord[] => {
    const defaultJarMap = new Map(DEFAULT_JARS.map(j => [j.id, j]));
    return records.map(p => {
        const hydratedRecord: MonthlyRecord = {
            month: p.month,
            incomes: p.incomes || [],
            expenses: p.expenses || [],
            jars: [], 
        };

        if (p.jars) {
            hydratedRecord.jars = p.jars.map((savedJar: Partial<Jar>) => {
                const defaultJar = defaultJarMap.get(savedJar.id!);
                if (!defaultJar) return null;
                return {
                    ...defaultJar,
                    percentage: savedJar.percentage !== undefined ? savedJar.percentage : defaultJar.percentage,
                };
            }).filter((j): j is Jar => j !== null);
        } else {
            hydratedRecord.jars = DEFAULT_JARS;
        }

        return hydratedRecord;
    });
};

const getYearMonth = (date: Date): string => {
    return date.toISOString().slice(0, 7);
};

const getInitialState = (): { initialHistory: MonthlyRecord[]; initialUserName: string } => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedData = urlParams.get('s');
    
    if (sharedData) {
        const decoded = decodeCompact(sharedData);
        if (decoded) {
            const currentMonth = getYearMonth(new Date());
            const history: MonthlyRecord[] = [{
                month: currentMonth,
                incomes: [],
                expenses: [],
                jars: decoded.jars
            }];
            // Xóa tham số URL sau khi nhận dữ liệu để tránh lặp lại
            const url = new URL(window.location.href);
            url.searchParams.delete('s');
            window.history.replaceState({}, document.title, url.pathname);
            
            return { initialHistory: hydrateRecords(history), initialUserName: decoded.userName };
        }
    }

    try {
        const saved = localStorage.getItem('financialData');
        if (saved) {
            const data = JSON.parse(saved);
            if (data?.history && typeof data.userName !== 'undefined') {
                 return {
                    initialHistory: hydrateRecords(data.history),
                    initialUserName: data.userName,
                 };
            }
        }
    } catch(err) {}

    const currentMonth = getYearMonth(new Date());
    return { 
        initialHistory: [{ month: currentMonth, incomes: [], expenses: [], jars: DEFAULT_JARS }], 
        initialUserName: '' 
    };
};

const { initialHistory, initialUserName } = getInitialState();

export default function App() {
    const [history, setHistory] = useState<MonthlyRecord[]>(initialHistory);
    const [userName, setUserName] = useState<string>(initialUserName);
    const [selectedMonth, setSelectedMonth] = useState<string>(initialHistory[initialHistory.length - 1].month);
    
    const [isIntroModalOpen, setIntroModalOpen] = useState<boolean>(false);
    const [isShareModalOpen, setShareModalOpen] = useState<boolean>(false);
    const [isBackupModalOpen, setBackupModalOpen] = useState<boolean>(false);
    
    const [aiAdvice, setAiAdvice] = useState<string>('');
    const [isLoadingAdvice, setIsLoadingAdvice] = useState<boolean>(false);
    const [adviceError, setAdviceError] = useState<string>('');

    const [incomeModalState, setIncomeModalState] = useState<{isOpen: boolean; incomeToEdit: Income | null}>({isOpen: false, incomeToEdit: null});
    const [expenseModalState, setExpenseModalState] = useState<{isOpen: boolean; expenseToEdit?: Expense; jarForNewExpense?: AllocatedJar}>({isOpen: false});
    
    useEffect(() => {
        const dataToSave = { history, userName };
        localStorage.setItem('financialData', JSON.stringify(dataToSave));
    }, [history, userName]);
    
    const currentMonthRecord = useMemo(() => {
        return history.find(record => record.month === selectedMonth) ?? history[history.length - 1];
    }, [history, selectedMonth]);

    const calculatedJarBalances = useMemo((): { [month: string]: AllocatedJar[] } => {
        const balances: { [month: string]: AllocatedJar[] } = {};
        const cumulativeBalances: { [id in Jar['id']]?: number } = {};
        const sortedHistory = [...history].sort((a, b) => a.month.localeCompare(b.month));

        for (const record of sortedHistory) {
            const totalIncome = (record.incomes || []).reduce((sum, income) => sum + income.amount, 0);
            const expensesThisMonth = record.expenses || [];

            const currentMonthAllocations: AllocatedJar[] = record.jars.map(jar => {
                const amountAddedThisMonth = (totalIncome * jar.percentage) / 100;
                const amountSpentThisMonth = expensesThisMonth
                    .filter(e => e.jarId === jar.id)
                    .reduce((sum, e) => sum + e.amount, 0);

                const previousBalance = cumulativeBalances[jar.id] || 0;
                const netChange = amountAddedThisMonth - amountSpentThisMonth;
                const cumulativeAmount = previousBalance + netChange;
                cumulativeBalances[jar.id] = cumulativeAmount;

                return {
                    ...jar,
                    amount: cumulativeAmount,
                    amountAddedThisMonth,
                    amountSpentThisMonth,
                };
            });
            balances[record.month] = currentMonthAllocations;
        }
        return balances;
    }, [history]);

    const allocatedJarsForSelectedMonth = calculatedJarBalances[selectedMonth] || [];
    const totalPercentage = currentMonthRecord.jars.reduce((acc, jar) => acc + jar.percentage, 0);

    const handleSaveIncome = useCallback((data: { amount: number; description: string; id?: string }) => {
        setHistory(prev => prev.map(record => {
            if (record.month !== selectedMonth) return record;
            let updatedIncomes: Income[];
            const currentIncomes = record.incomes || [];
            if (data.id) {
                updatedIncomes = currentIncomes.map(inc => inc.id === data.id ? { ...inc, amount: data.amount, description: data.description } : inc);
            } else {
                const newIncome: Income = { ...data, id: `${Date.now()}-${Math.random()}` };
                updatedIncomes = [...currentIncomes, newIncome];
            }
            return { ...record, incomes: updatedIncomes };
        }));
        setIncomeModalState({ isOpen: false, incomeToEdit: null });
    }, [selectedMonth]);
    
    const handleDeleteIncome = useCallback((incomeId: string) => {
        if (window.confirm('Xóa khoản thu nhập này?')) {
            setHistory(prev => prev.map(record => {
                if (record.month !== selectedMonth) return record;
                return { ...record, incomes: (record.incomes || []).filter(inc => inc.id !== incomeId) };
            }));
        }
    }, [selectedMonth]);

    const handlePercentageChange = (id: Jar['id'], newPercentage: number) => {
        setHistory(prevHistory => prevHistory.map(record => 
            record.month === selectedMonth 
            ? { ...record, jars: record.jars.map(jar => jar.id === id ? {...jar, percentage: newPercentage} : jar) } 
            : record
        ));
    };

    const handleSaveExpense = useCallback((data: {id?: string, jarId: Jar['id'], amount: number, description: string}) => {
         setHistory(prev => prev.map(record => {
            if (record.month !== selectedMonth) return record;
            let updatedExpenses: Expense[];
            const currentExpenses = record.expenses || [];
            if (data.id) {
                updatedExpenses = currentExpenses.map(exp => exp.id === data.id ? { ...exp, ...data} : exp);
            } else {
                const newExpense: Expense = { ...data, id: `${Date.now()}-${Math.random()}` };
                updatedExpenses = [...currentExpenses, newExpense];
            }
            return { ...record, expenses: updatedExpenses };
        }));
        setExpenseModalState({isOpen: false});
    }, [selectedMonth]);

    const handleDeleteExpense = useCallback((expenseId: string) => {
        if (window.confirm('Xóa chi tiêu này?')) {
            setHistory(prev => prev.map(record => {
                if (record.month !== selectedMonth) return record;
                return { ...record, expenses: (record.expenses || []).filter(exp => exp.id !== expenseId) };
            }));
        }
    }, [selectedMonth]);
    
    const handleAddNewMonth = () => {
        const lastRecord = history[history.length - 1];
        const lastMonthDate = new Date(`${lastRecord.month}-01T12:00:00Z`);
        const nextMonthDate = new Date(lastMonthDate.setMonth(lastMonthDate.getMonth() + 1));
        const newMonth = getYearMonth(nextMonthDate);
        if (history.some(h => h.month === newMonth)) return; 
        setHistory(prev => [...prev, { month: newMonth, incomes: [], jars: lastRecord.jars, expenses: [] }]);
        setSelectedMonth(newMonth);
    };

    const handleRestoreData = useCallback((data: { history: MonthlyRecord[], userName: string }) => {
        const hydrated = hydrateRecords(data.history);
        setHistory(hydrated);
        setUserName(data.userName);
        if (hydrated.length > 0) {
            setSelectedMonth(hydrated[hydrated.length - 1].month);
        }
    }, []);

    const handleFetchAdvice = useCallback(async (situation: string) => {
        setIsLoadingAdvice(true);
        setAiAdvice('');
        setAdviceError('');
        try {
            const advice = await getFinancialAdvice(situation, currentMonthRecord.jars);
            setAiAdvice(advice);
        } catch (err) {
            setAdviceError(err instanceof Error ? err.message : 'Lỗi kết nối AI.');
        } finally {
            setIsLoadingAdvice(false);
        }
    }, [currentMonthRecord]);
    
    const availableMonths = useMemo(() => history.map(h => h.month).sort((a,b) => a.localeCompare(b)), [history]);

    const shareUrl = useMemo(() => {
        try {
            const encoded = encodeCompact(userName, currentMonthRecord.jars);
            const url = new URL(window.location.origin + window.location.pathname);
            url.searchParams.set('s', encoded);
            return url.toString();
        } catch (e) {
            return window.location.href.split('?')[0] + "?s=" + encodeCompact(userName, currentMonthRecord.jars);
        }
    }, [userName, currentMonthRecord]);

    const qrCodeUrl = useMemo(() => {
        return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(shareUrl)}`;
    }, [shareUrl]);

    return (
        <div className="min-h-screen flex flex-col font-sans">
            <Header 
                onIntroClick={() => setIntroModalOpen(true)}
                onShareClick={() => setShareModalOpen(true)}
                onBackupClick={() => setBackupModalOpen(true)}
                appVersion={APP_VERSION}
                userName={userName}
                onUserNameChange={setUserName}
            />
            
            <main className="flex-grow container mx-auto p-3 sm:p-4 md:p-6 lg:p-8">
                <MonthNavigator
                    selectedMonth={selectedMonth}
                    availableMonths={availableMonths}
                    onMonthChange={setSelectedMonth}
                    onAddNewMonth={handleAddNewMonth}
                />
                <div className="mt-6 space-y-6 md:space-y-8">
                    <IncomeInput
                        incomes={currentMonthRecord.incomes || []}
                        onAddClick={() => setIncomeModalState({ isOpen: true, incomeToEdit: null })}
                        onEditClick={(income) => setIncomeModalState({ isOpen: true, incomeToEdit: income })}
                        onDeleteClick={handleDeleteIncome}
                    />
                    <JarsDisplay
                        jars={allocatedJarsForSelectedMonth}
                        onPercentageChange={handlePercentageChange}
                        totalPercentage={totalPercentage}
                        onOpenAddExpenseModal={(jar) => setExpenseModalState({isOpen: true, jarForNewExpense: jar})}
                    />
                    <ExpenseList
                        expenses={currentMonthRecord.expenses || []}
                        jars={allocatedJarsForSelectedMonth}
                        onEdit={(expense) => setExpenseModalState({isOpen: true, expenseToEdit: expense})}
                        onDelete={handleDeleteExpense}
                    />
                </div>

                <MonthlyReport 
                    history={history}
                    calculatedJarBalances={calculatedJarBalances}
                />

                <div className="mt-6 md:mt-8">
                    <Dashboard
                        onFetchAdvice={handleFetchAdvice}
                        aiAdvice={aiAdvice}
                        isLoading={isLoadingAdvice}
                        error={adviceError}
                    />
                </div>

                <div className="flex flex-col items-center mt-8 md:mt-12 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                    <h4 className="text-slate-700 font-bold mb-4">Chia sẻ nhanh qua QR Code</h4>
                    <div className="bg-slate-50 p-4 rounded-2xl shadow-inner mb-4">
                        <img 
                            src={qrCodeUrl} 
                            alt="QR Code"
                            className="w-40 h-40 rounded-lg shadow-sm"
                        />
                    </div>
                    <p className="text-xs text-slate-500 text-center max-w-xs leading-relaxed">
                        Quét mã này để chia sẻ cấu hình hũ của bạn. Dùng tính năng <strong>Sao lưu</strong> nếu muốn chuyển toàn bộ lịch sử chi tiêu.
                    </p>
                </div>
            </main>

            <footer className="text-center p-6 text-slate-400 text-xs">
                <p>Tất cả dữ liệu được lưu cục bộ trên trình duyệt.</p>
                <p className="mt-1">&copy; 2024 Sáu Túi Tài Chính. v{APP_VERSION}</p>
            </footer>
            
            <IntroductionModal isOpen={isIntroModalOpen} onClose={() => setIntroModalOpen(false)} />
            <ShareModal isOpen={isShareModalOpen} onClose={() => setShareModalOpen(false)} shareUrl={shareUrl} />
            <BackupModal 
                isOpen={isBackupModalOpen} 
                onClose={() => setBackupModalOpen(false)} 
                history={history}
                userName={userName}
                onRestore={handleRestoreData}
            />
            <AddIncomeModal isOpen={incomeModalState.isOpen} onClose={() => setIncomeModalState({ isOpen: false, incomeToEdit: null })} onSave={handleSaveIncome} incomeToEdit={incomeModalState.incomeToEdit} />
             <AddExpenseModal isOpen={expenseModalState.isOpen} onClose={() => setExpenseModalState({ isOpen: false })} onSave={handleSaveExpense} expenseToEdit={expenseModalState.expenseToEdit} jarForNewExpense={expenseModalState.jarForNewExpense} jars={allocatedJarsForSelectedMonth} />
        </div>
    );
}
