// 'use client';

import { DashBoardApp } from './index.jsx';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const navigation = [
  { name: 'Request History', href: '#', current: true },
  { name: 'Dashboard', href: '#', current: false }
  // { name: 'Settings', href: '#', current: false },
];

const Logo = (props) => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
     <path
       d="M10.9999 2.04938L11 5.07088C7.6077 5.55612 5 8.47352 5 12C5 15.866 8.13401 19 12 19C13.5723 19 15.0236 18.4816 16.1922 17.6064L18.3289 19.7428C16.605 21.1536 14.4014 22 12 22C6.47715 22 2 17.5228 2 12C2 6.81468 5.94662 2.55115 10.9999 2.04938ZM21.9506 13.0001C21.7509 15.0111 20.9555 16.8468 19.7433 18.3283L17.6064 16.1922C18.2926 15.2759 18.7595 14.1859 18.9291 13L21.9506 13.0001ZM13.0011 2.04948C17.725 2.51902 21.4815 6.27589 21.9506 10.9999L18.9291 10.9998C18.4905 7.93452 16.0661 5.50992 13.001 5.07103L13.0011 2.04948Z" />
   </svg>
);

export default function Workspace() {
  return (
    <>
      <div className="border-b border-tremor-border dark:border-dark-tremor-border relative h-full overflow-hidden bg-gray-50 dark:bg-dark-tremor-background-subtle">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="overflow flex h-16 sm:space-x-7">
            <div className="hidden shrink-0 sm:flex sm:items-center">
              <a href="#" className="p-1.5">
                <Logo
                  className="size-5 shrink-0 text-tremor-content-strong dark:text-dark-tremor-content-strong"
                  aria-hidden={true}
                />
              </a>
            </div>
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className={classNames(
                    item.current
                      ? 'dark:text-tremor-dark-brand border-tremor-brand text-tremor-brand'
                      : 'border-transparent text-tremor-content-emphasis hover:border-tremor-content-subtle hover:text-tremor-content-strong dark:text-dark-tremor-content-emphasis hover:dark:border-dark-tremor-content-subtle hover:dark:text-dark-tremor-content-strong',
                    'inline-flex items-center whitespace-nowrap border-b-2 px-2 text-tremor-default font-medium'
                  )}
                  aria-current={item.current ? 'page' : undefined}
                >
                  {item.name}
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-950">
        <DashBoardApp></DashBoardApp>
      </div>
    </>
  );
}