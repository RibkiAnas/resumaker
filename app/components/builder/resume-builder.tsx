import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '../ui/tooltip';
import { ResizablePanel, ResizablePanelGroup } from '../ui/resizable';
import { Separator } from '../ui/separator';
import {
	Book,
	Bot,
	CircleUser,
	Code2,
	Settings2,
	SquareTerminal,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

import { Button } from '../ui/button';
import Logo from '../../assets/logo-black-1200x1200.png';
import ResumeForms from './resumeForm';
import ResumeDisplay from './resume-display';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Form, Link } from '@remix-run/react';
import { AuthenticityTokenInput } from 'remix-utils/csrf/react';

interface ResumeBuilderProps {
	resume: { id: string; title: string | null; content: unknown };
	isLoggedInUser: boolean;
	defaultLayout?: number[] | undefined;
}

function ResumeBuilder({
	resume,
	isLoggedInUser,
	defaultLayout = [265, 440, 655],
}: ResumeBuilderProps) {
	return (
		<TooltipProvider delayDuration={0}>
			<ResizablePanelGroup
				direction='horizontal'
				onLayout={(sizes: number[]) => {
					document.cookie = `react-resizable-panels:layout=${JSON.stringify(
						sizes
					)}`;
				}}
				className='h-full max-h-[100vh] items-stretch'
			>
				<aside className='inset-y hidden z-20 sm:flex max-h-[100vh] flex-col border-r'>
					<div className='border-b p-2'>
						<Button variant='outline' size='icon' aria-label='Home'>
							<img src={Logo} alt='logo' className='h-6 w-6 fill-foreground' />
						</Button>
					</div>
					<nav className='grid gap-1 p-2'>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant='ghost'
									size='icon'
									className='rounded-lg bg-muted'
									aria-label='Playground'
								>
									<SquareTerminal className='size-5' />
								</Button>
							</TooltipTrigger>
							<TooltipContent side='right' sideOffset={5}>
								Playground
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant='ghost'
									size='icon'
									className='rounded-lg'
									aria-label='Models'
								>
									<Bot className='size-5' />
								</Button>
							</TooltipTrigger>
							<TooltipContent side='right' sideOffset={5}>
								Models
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant='ghost'
									size='icon'
									className='rounded-lg'
									aria-label='API'
								>
									<Code2 className='size-5' />
								</Button>
							</TooltipTrigger>
							<TooltipContent side='right' sideOffset={5}>
								API
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant='ghost'
									size='icon'
									className='rounded-lg'
									aria-label='Documentation'
								>
									<Book className='size-5' />
								</Button>
							</TooltipTrigger>
							<TooltipContent side='right' sideOffset={5}>
								Documentation
							</TooltipContent>
						</Tooltip>
						<Tooltip>
							<TooltipTrigger asChild>
								<Button
									variant='ghost'
									size='icon'
									className='rounded-lg'
									aria-label='Settings'
								>
									<Settings2 className='size-5' />
								</Button>
							</TooltipTrigger>
							<TooltipContent side='right' sideOffset={5}>
								Settings
							</TooltipContent>
						</Tooltip>
					</nav>
					<nav className='mt-auto grid gap-1 p-2'>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant='ghost' size='icon' className='rounded-lg'>
									<CircleUser className='h-5 w-5' />
									<span className='sr-only'>Toggle user menu</span>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='start'>
								<DropdownMenuLabel>My Account</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem>
									<Link to='/dashboard/settings/profile'>Settings</Link>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem>
									{isLoggedInUser ? (
										<Form action='/logout' method='POST'>
											<AuthenticityTokenInput />
											<button type='submit'>Logout</button>
										</Form>
									) : null}
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</nav>
				</aside>
				<ResizablePanel
					defaultSize={defaultLayout[1]}
					minSize={30}
					className='hidden md:flex'
				>
					<Tabs defaultValue='editor'>
						<div className='flex items-center px-4 py-2'>
							<TabsList className='grid w-full grid-cols-2'>
								<TabsTrigger className='h-full' value='editor'>
									Editor
								</TabsTrigger>
								<TabsTrigger className='h-full' value='customizer'>
									Customizer
								</TabsTrigger>
							</TabsList>
						</div>
						<Separator />
						<TabsContent value='editor'>
							<ResumeForms />
						</TabsContent>
						<TabsContent value='customizer'>
							<ResumeForms />
						</TabsContent>
					</Tabs>
				</ResizablePanel>
				{/* <ResizableHandle className='hidden md:flex' withHandle /> */}
				<ResizablePanel defaultSize={defaultLayout[2]} className='border'>
					<ResumeDisplay resume={resume} />
				</ResizablePanel>
			</ResizablePanelGroup>
		</TooltipProvider>
	);
}

export default ResumeBuilder;
