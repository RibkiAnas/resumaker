import { ChevronRightIcon } from 'lucide-react';
import { Hero, HeroSubtitle, HeroTitle } from '../hero/hero';
import { Highlight, HomeBtn } from '../home-btn';
import { Button } from '~/components/ui/button';
import { useNavigate } from '@remix-run/react';
import { createId as cuid } from '@paralleldrive/cuid2';

function HomepageHero() {
	const navigate = useNavigate();

	return (
		<Hero>
			<HomeBtn
				className='translate-y-[-1rem] animate-fade-in opacity-0'
				href='/'
				variant='secondary'
				size='small'
			>
				<span>Resumaker 2024 Release – Built for you</span>{' '}
				<Highlight>→</Highlight>
			</HomeBtn>
			<HeroTitle className='translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:200ms]'>
				Resumaker is a better way
				<br className='hidden md:block' /> to build your resume.
			</HeroTitle>
			<HeroSubtitle className='text-balance translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:400ms]'>
				A resume builder that simplifies the process of creating,
				<br className='hidden md:block' /> updating, and sharing your resume.
			</HeroSubtitle>
			<Button
				className='translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms] rounded-lg'
				variant='default'
				size='lg'
				onClick={() => {
					navigate(`/dashboard/builder/${cuid()}`);
				}}
			>
				<span>Get Started</span>
				<Highlight>
					<ChevronRightIcon />
				</Highlight>
			</Button>
		</Hero>
	);
}

export default HomepageHero;
