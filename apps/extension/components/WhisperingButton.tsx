import { Button, type ButtonProps } from '@/components/ui/button';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import type { PropsWithChildren, ReactNode } from 'react';

export function WhisperingButton({
	children,
	tooltipContent,
	...restProps
}: PropsWithChildren<{ tooltipContent: ReactNode } & ButtonProps>) {
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button {...restProps}>
						{children}
						<span className="sr-only">{tooltipContent}</span>
					</Button>
				</TooltipTrigger>
				<TooltipContent>{tooltipContent}</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
