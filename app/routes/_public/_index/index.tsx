import type { MetaFunction } from '@remix-run/cloudflare';
import { useInView } from 'react-intersection-observer';
import Container from '~/components/home/container';
import HomepageHero from '~/components/home/sections/homepage-hero';
import { cn } from '~/lib/utils';
import { HeroImage } from '~/components/home/hero/hero-image';
import { FeatureTabs } from '~/components/home/sections/feature-tabs';

export const meta: MetaFunction = () => {
	return [
		{ title: 'Resumaker | Home' },
		{
			name: 'description',
			content: 'Welcome to Resumaker!',
		},
	];
};

export default function HomePage() {
	const { ref, inView } = useInView({ threshold: 0.2, triggerOnce: false });

	return (
		<>
			<div className='overflow-hidden pb-[16.4rem]'>
				<Container className='pt-[6.4rem]'>
					<HomepageHero />
				</Container>

				<Container className='pt-[6.4rem]'>
					<HeroImage />
				</Container>

				<section
					ref={ref}
					className={cn(
						'after:bg-[radial-gradient(ellipse_100%_40%_at_50%_60%,rgba(var(--feature-color),0.1),transparent) relative flex flex-col items-center overflow-x-clip before:pointer-events-none before:absolute before:h-[40rem] before:w-full before:bg-[conic-gradient(from_90deg_at_80%_50%,#000212,rgb(var(--feature-color-dark))),conic-gradient(from_270deg_at_20%_50%,rgb(var(--feature-color-dark)),#000212)] before:bg-no-repeat before:transition-[transform,opacity] before:duration-1000 before:ease-in before:[mask:radial-gradient(100%_50%_at_center_center,_black,_transparent)] before:[background-size:50%_100%,50%_100%] before:[background-position:1%_0%,99%_0%] after:pointer-events-none after:absolute after:inset-0',
						inView &&
							'is-visible before:opacity-100 before:[transform:rotate(180deg)_scale(2)]',
						!inView && 'before:rotate-180 before:opacity-40'
					)}
					style={
						{
							'--feature-color': '120,119,198,0',
							'--feature-color-dark': '255,255,255',
						} as React.CSSProperties
					}
				>
					<div className='mb-16 mt-[14rem] w-full md:mb-[12.8rem] md:mt-[27.2rem]'>
						<div
							id='features'
							className='relative scroll-mt-[calc(5rem_+_var(--navigation-height))] before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_50%_50%_at_center,rgba(var(--feature-color),0.1),transparent)]'
						>
							<Container className='pt-[6.4rem]'>
								<h2 className='text-gradient mb-11 translate-y-[40%] pt-12  text-center text-6xl [transition:transform_1000ms_cubic-bezier(0.3,_1.17,_0.55,_0.99)_0s] md:pt-0 md:text-8xl [.is-visible_&]:translate-y-0'>
									Resume builder you&apos;ll enjoy using
								</h2>
							</Container>
							<Container className='pt-[6.4rem]'>
								<FeatureTabs />
							</Container>
						</div>
					</div>
				</section>
			</div>
		</>
	);
}
