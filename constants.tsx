import React from 'react';
import type { Jar, IconProps } from './types';

const NECIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const FFAIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
const LTSIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
const EDUIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-5.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14v6m-6-3h12" /></svg>;
const PLAYIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
const GIVEIcon: React.FC<IconProps> = ({ className = "h-8 w-8" }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c1.657 0 3-1.343 3-3S13.657 2 12 2 9 3.343 9 5s1.343 3 3 3zm0 2c-2.21 0-4 1.79-4 4v1h8v-1c0-2.21-1.79-4-4-4zm6 4h-2v-1c0-1.325-.634-2.503-1.666-3.333C15.068 12.25 13.58 12 12 12s-3.068.25-4.334.667C6.634 13.497 6 14.675 6 16v1H4v5h16v-5z" /></svg>;

export const DEFAULT_JARS: Jar[] = [
    {
        id: 'NEC',
        name: 'Chi phí thiết yếu',
        percentage: 55,
        description: 'Chi tiêu cho nhu cầu sống cơ bản: ăn uống, nhà ở, đi lại, hóa đơn.',
        color: 'bg-sky-500',
        icon: <NECIcon />
    },
    {
        id: 'FFA',
        name: 'Tự do tài chính',
        percentage: 10,
        description: 'Đầu tư để tạo ra thu nhập thụ động, không được tiêu.',
        color: 'bg-emerald-500',
        icon: <FFAIcon />
    },
    {
        id: 'LTS',
        name: 'Tiết kiệm dài hạn',
        percentage: 10,
        description: 'Dành cho các mục tiêu lớn: mua nhà, xe, du lịch, đám cưới.',
        color: 'bg-indigo-500',
        icon: <LTSIcon />
    },
    {
        id: 'EDU',
        name: 'Giáo dục',
        percentage: 10,
        description: 'Đầu tư cho bản thân: sách, khóa học, hội thảo để phát triển.',
        color: 'bg-amber-500',
        icon: <EDUIcon />
    },
    {
        id: 'PLAY',
        name: 'Hưởng thụ',
        percentage: 10,
        description: 'Tiêu cho sở thích, giải trí, tự thưởng để có động lực.',
        color: 'bg-rose-500',
        icon: <PLAYIcon />
    },
    {
        id: 'GIVE',
        name: 'Cho đi',
        percentage: 5,
        description: 'Từ thiện, giúp đỡ gia đình, bạn bè, quà tặng.',
        color: 'bg-fuchsia-500',
        icon: <GIVEIcon />
    },
];