import type { MetaFunction } from '@remix-run/cloudflare';
import Container from '~/components/home/container';
import HomepageHero from '~/components/home/sections/homepage-hero';

export const meta: MetaFunction = () => {
	return [
		{ title: 'New Remix App' },
		{
			name: 'description',
			content: 'Welcome to Remix! Using Vite and Cloudflare!',
		},
	];
};

export default function HomePage() {
	return (
		<>
			<div className='overflow-hidden pb-[16.4rem] md:pb-[25.6rem]'>
				<Container className='pt-[6.4rem]'>
					<HomepageHero />
				</Container>
			</div>
		</>
	);
}
