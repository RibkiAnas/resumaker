import { TooltipProvider } from '../ui/tooltip';
import { ResizablePanel, ResizablePanelGroup } from '../ui/resizable';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

import ResumeForms from './resumeForm';
import ResumeDisplay from './resume-display';
import { ThemeForm } from './resumeForm/themeForm';

interface ResumeBuilderProps {
	resume: { id: string; title: string | null; content: unknown };
	defaultLayout?: number[] | undefined;
}

function ResumeBuilder({
	resume,
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
							<ResumeForms resumeId={resume.id} />
						</TabsContent>
						<TabsContent value='customizer'>
							<ThemeForm />
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
