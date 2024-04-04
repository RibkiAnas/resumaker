import type { MetaFunction } from '@remix-run/cloudflare';
import Container from '~/components/home/container';
import HomepageHero from '~/components/home/sections/homepage-hero';
import { HeroImage } from '~/components/home/hero/hero-image';

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
	return (
		<>
			<div className='overflow-hidden pb-[16.4rem]'>
				<Container className='pt-[6.4rem]'>
					<HomepageHero />
				</Container>

				<Container className='pt-[6.4rem]'>
					<HeroImage />
				</Container>
			</div>
		</>
	);
}
