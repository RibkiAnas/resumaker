import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Textarea } from '~/components/ui/textarea';
import { useAppDispatch, useAppSelector } from '~/lib/redux/hooks';
import { changeProfile, selectProfile } from '~/lib/redux/resumeSlice';
import { ResumeProfile } from '~/lib/redux/types';

export const ProfileForm = () => {
	const profile = useAppSelector(selectProfile);
	const dispatch = useAppDispatch();
	const { name, email, phone, url, summary, location } = profile;

	const handleProfileChange = (field: keyof ResumeProfile, value: string) => {
		dispatch(changeProfile({ field, value }));
	};

	return (
		<fieldset className='grid gap-6 rounded-lg border p-4 mb-3'>
			<legend className='-ml-1 px-1 text-sm font-medium'>Profile</legend>
			<div className='grid gap-3'>
				<Label htmlFor='name'>Name</Label>
				<Input
					id='name'
					name='name'
					placeholder='Anas Ribki'
					value={name}
					onChange={(e) => handleProfileChange('name', e.target.value)}
				/>
			</div>
			<div className='grid gap-3'>
				<Label htmlFor='summary'>Objective</Label>
				<Textarea
					id='summary'
					name='summary'
					placeholder='Entrepreneur and educator obsessed with making education free for anyone'
					className='min-h-[9.5rem]'
					value={summary}
					onChange={(e) => handleProfileChange('summary', e.target.value)}
				/>
			</div>
			<div className='grid grid-cols-2 gap-4'>
				<div className='grid gap-3'>
					<Label htmlFor='email'>Email</Label>
					<Input
						id='email'
						name='email'
						type='email'
						placeholder='me@example.com'
						value={email}
						onChange={(e) => handleProfileChange('email', e.target.value)}
					/>
				</div>
				<div className='grid gap-3'>
					<Label htmlFor='phone'>Phone</Label>
					<Input
						id='phone'
						name='phone'
						placeholder='+212 621463578'
						value={phone}
						onChange={(e) => handleProfileChange('phone', e.target.value)}
					/>
				</div>
			</div>
			<div className='grid grid-cols-2 gap-4'>
				<div className='grid gap-3'>
					<Label htmlFor='website'>Website</Label>
					<Input
						id='website'
						name='url'
						placeholder='linkedin.com/in/anas-ribki'
						value={url}
						onChange={(e) => handleProfileChange('url', e.target.value)}
					/>
				</div>
				<div className='grid gap-3'>
					<Label htmlFor='location'>Location</Label>
					<Input
						id='location'
						name='location'
						placeholder='Morocco, Marrakech'
						value={location}
						onChange={(e) => handleProfileChange('location', e.target.value)}
					/>
				</div>
			</div>
		</fieldset>
	);
};
