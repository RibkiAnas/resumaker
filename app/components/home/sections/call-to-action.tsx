import { ChevronRightIcon } from 'lucide-react';
import { Image, remixImageLoader } from 'remix-image';
import { useNavigate } from '@remix-run/react';
import { Button } from '~/components/ui/button';
import { Highlight } from '~/components/home/home-btn';
import { useOptionalUser } from '~/utils/user';
import Logo from '~/assets/logo-black-1200x1200.png';

export const CallToAction = () => {
	const navigate = useNavigate();
	const user = useOptionalUser();

	return (
		<div className='mx-auto flex w-full max-w-6xl flex-col items-center'>
			<div
				className='absolute inset-0 aspect-square w-full rounded-full bg-slate-500/50 blur-[160px] filter'
				style={{
					translate: 'none',
					rotate: 'none',
					scale: 'none',
					transform: 'translate(0px, 0px)',
				}}
			/>
			<div
				className='glass-container rounded-lg bg-white p-3 md:rounded-xl'
				style={{
					translate: 'none',
					rotate: 'none',
					scale: 'none',
					transform: 'translate(0px, 0px)',
				}}
			>
				<Image
					className='rounded-lg w-[10rem] h-[10rem]'
					loaderUrl='/resources/image'
					loader={remixImageLoader}
					src={Logo}
					alt='Resumaker logo'
				/>
			</div>
			<div className='mt-8 max-w-xl text-balance text-5xl'>
				Ready to Jump Start Your Career
			</div>
			<Button
				className='mt-5 translate-y-[-1rem] animate-fade-in opacity-0 [--animation-delay:600ms] rounded-lg'
				variant='default'
				size='lg'
				onClick={() => {
					if (user) navigate('/dashboard/resumes');
					else navigate('/login');
				}}
			>
				{user ? <span>Got to Dashboard</span> : <span>Get Started</span>}
				<Highlight>
					<ChevronRightIcon />
				</Highlight>
			</Button>
		</div>
	);
};
