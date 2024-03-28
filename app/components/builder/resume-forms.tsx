import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select';
import { Bird, Rabbit, Turtle } from 'lucide-react';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Label } from '../ui/label';

function ResumeForms() {
	return (
		<ScrollArea className='flex flex-col gap-2 p-4 pt-0 h-screen'>
			<fieldset className='grid gap-6 rounded-lg border p-4'>
				<legend className='-ml-1 px-1 text-sm font-medium'>Settings</legend>
				<div className='grid gap-3'>
					<Label htmlFor='model'>Model</Label>
					<Select>
						<SelectTrigger
							id='model'
							className='items-start [&_[data-description]]:hidden'
						>
							<SelectValue placeholder='Select a model' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='genesis'>
								<div className='flex items-start gap-3 text-muted-foreground'>
									<Rabbit className='size-5' />
									<div className='grid gap-0.5'>
										<p>
											Neural{' '}
											<span className='font-medium text-foreground'>
												Genesis
											</span>
										</p>
										<p className='text-xs' data-description>
											Our fastest model for general use cases.
										</p>
									</div>
								</div>
							</SelectItem>
							<SelectItem value='explorer'>
								<div className='flex items-start gap-3 text-muted-foreground'>
									<Bird className='size-5' />
									<div className='grid gap-0.5'>
										<p>
											Neural{' '}
											<span className='font-medium text-foreground'>
												Explorer
											</span>
										</p>
										<p className='text-xs' data-description>
											Performance and speed for efficiency.
										</p>
									</div>
								</div>
							</SelectItem>
							<SelectItem value='quantum'>
								<div className='flex items-start gap-3 text-muted-foreground'>
									<Turtle className='size-5' />
									<div className='grid gap-0.5'>
										<p>
											Neural{' '}
											<span className='font-medium text-foreground'>
												Quantum
											</span>
										</p>
										<p className='text-xs' data-description>
											The most powerful model for complex computations.
										</p>
									</div>
								</div>
							</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className='grid gap-3'>
					<Label htmlFor='temperature'>Temperature</Label>
					<Input id='temperature' type='number' placeholder='0.4' />
				</div>
				<div className='grid grid-cols-2 gap-4'>
					<div className='grid gap-3'>
						<Label htmlFor='top-p'>Top P</Label>
						<Input id='top-p' type='number' placeholder='0.7' />
					</div>
					<div className='grid gap-3'>
						<Label htmlFor='top-k'>Top K</Label>
						<Input id='top-k' type='number' placeholder='0.0' />
					</div>
				</div>
			</fieldset>
			<fieldset className='grid gap-6 rounded-lg border p-4'>
				<legend className='-ml-1 px-1 text-sm font-medium'>Messages</legend>
				<div className='grid gap-3'>
					<Label htmlFor='role'>Role</Label>
					<Select defaultValue='system'>
						<SelectTrigger>
							<SelectValue placeholder='Select a role' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='system'>System</SelectItem>
							<SelectItem value='user'>User</SelectItem>
							<SelectItem value='assistant'>Assistant</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className='grid gap-3'>
					<Label htmlFor='content'>Content</Label>
					<Textarea
						id='content'
						placeholder='You are a...'
						className='min-h-[9.5rem]'
					/>
				</div>
			</fieldset>
			<fieldset className='grid gap-6 rounded-lg border p-4 mb-16'>
				<legend className='-ml-1 px-1 text-sm font-medium'>Messages</legend>
				<div className='grid gap-3'>
					<Label htmlFor='role'>Role</Label>
					<Select defaultValue='system'>
						<SelectTrigger>
							<SelectValue placeholder='Select a role' />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value='system'>System</SelectItem>
							<SelectItem value='user'>User</SelectItem>
							<SelectItem value='assistant'>Assistant</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<div className='grid gap-3'>
					<Label htmlFor='content'>Content</Label>
					<Textarea
						id='content'
						placeholder='You are a...'
						className='min-h-[9.5rem]'
					/>
				</div>
			</fieldset>
		</ScrollArea>
	);
}

export default ResumeForms;