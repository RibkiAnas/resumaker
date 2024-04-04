import { Image, remixImageLoader } from 'remix-image';
import ImageHero from '~/assets/hero-image.png';

export const HeroImage = () => {
	return (
		<div
			className='glass-container w-fit'
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
			<Image
				className='rounded-lg w-[100vw]'
				loaderUrl='/resources/image'
				loader={remixImageLoader}
				src={ImageHero}
				alt='The dashboard of Resumaker'
			/>
		</div>
	);
};
