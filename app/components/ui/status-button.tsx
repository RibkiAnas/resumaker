import * as React from 'react';
import { type ButtonProps } from './button';
import { cn } from '../../utils/misc';

export const StatusButton = React.forwardRef<
	HTMLButtonElement,
	ButtonProps & { status: 'pending' | 'success' | 'error' | 'idle' }
>(({ status = 'idle', className, children, ...props }, ref) => {
	const companion = {
		pending: <span className='inline-block animate-spin'>🌀</span>,
		success: <span>✅</span>,
		error: <span>❌</span>,
		idle: null,
	}[status];
	return (
		<button
			ref={ref}
			className={cn(
				'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2',
				className
			)}
			{...props}
		>
			<div>{children}</div>
			{companion}
		</button>
	);
});
StatusButton.displayName = 'Button';
