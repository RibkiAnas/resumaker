import { Image, remixImageLoader } from 'remix-image';
import { Tabs } from '../tabs';
import Editor from '~/assets/hero-image.png';
import Customizor from '~/assets/resume-editor.png';
import Dashboard from '~/assets/resume-dashboard.png';

export const FeatureTabs = () => {
	const tabs = [
		{
			title: 'Editor',
			value: 'editor',
			content: (
				<div
					className='glass-container w-full h-full'
					style={{
						translate: 'none',
						rotate: 'none',
						scale: 'none',
						transform: 'translate(0px, 0px)',
					}}
				>
					<div
						className='absolute inset-0 -z-10 bg-slate-500/30 blur-2xl filter'
						style={{
							translate: 'none',
							rotate: 'none',
							scale: 'none',
							transform: 'translate(0px, 0px)',
						}}
					/>
					<div className='w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-bold bg-white'>
						<p>Editor Tab</p>
						<Image
							className='object-cover object-left-top h-[60%]  md:h-[90%] absolute -bottom-7 md:-bottom-16 inset-x-0 w-[93%] rounded-xl mx-auto border'
							loaderUrl='/resources/image'
							loader={remixImageLoader}
							src={Editor}
							alt='The dashboard editor'
						/>
					</div>
				</div>
			),
		},
		{
			title: 'Customizer',
			value: 'customizer',
			content: (
				<div
					className='glass-container w-full h-full'
					style={{
						translate: 'none',
						rotate: 'none',
						scale: 'none',
						transform: 'translate(0px, 0px)',
					}}
				>
					<div
						className='absolute inset-0 -z-10 bg-slate-500/30 blur-2xl filter'
						style={{
							translate: 'none',
							rotate: 'none',
							scale: 'none',
							transform: 'translate(0px, 0px)',
						}}
					/>
					<div className='w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-bold bg-white'>
						<p>Customizer tab</p>
						<Image
							className='object-cover object-left-top h-[60%]  md:h-[90%] absolute -bottom-7 md:-bottom-16 inset-x-0 w-[93%] rounded-xl mx-auto border'
							loaderUrl='/resources/image'
							loader={remixImageLoader}
							src={Customizor}
							alt='The dashboard of Resumaker'
						/>
					</div>
				</div>
			),
		},
		{
			title: 'Dashboard',
			value: 'dashboard',
			content: (
				<div
					className='glass-container w-full h-full'
					style={{
						translate: 'none',
						rotate: 'none',
						scale: 'none',
						transform: 'translate(0px, 0px)',
					}}
				>
					<div
						className='absolute inset-0 -z-10 bg-slate-500/30 blur-2xl filter'
						style={{
							translate: 'none',
							rotate: 'none',
							scale: 'none',
							transform: 'translate(0px, 0px)',
						}}
					/>
					<div className='w-full overflow-hidden relative h-full rounded-2xl p-10 text-xl md:text-4xl font-bold bg-white'>
						<p>Dashboard tab</p>
						<Image
							className='object-cover object-left-top h-[60%]  md:h-[90%] absolute -bottom-7 md:-bottom-16 inset-x-0 w-[93%] rounded-xl mx-auto border'
							loaderUrl='/resources/image'
							loader={remixImageLoader}
							src={Dashboard}
							alt='The dashboard of Resumaker'
						/>
					</div>
				</div>
			),
		},
	];

	return (
		<div className='h-[20rem] md:h-[40rem] [perspective:1000px] relative b flex flex-col mx-auto w-full items-start justify-start my-40'>
			<Tabs tabs={tabs} />
		</div>
	);
};
