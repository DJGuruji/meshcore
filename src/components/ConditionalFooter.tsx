'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Don't show footer on these pages
  const excludedPaths = ['/api-tester', '/graphql-tester'];
  
  // Check if current path should exclude footer
  const shouldHideFooter = excludedPaths.some(path => pathname?.startsWith(path));
  
  if (shouldHideFooter) {
    return null;
  }
  
  return <Footer />;
}
