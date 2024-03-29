import { useAppDispatch, useAppSelector } from '~/lib/redux/hooks';
import { changeCustom, selectCustom } from '~/lib/redux/resumeSlice';
import { Form } from './form';
import { Label } from '~/components/ui/label';
import { Textarea } from '~/components/ui/textarea';

export const CustomForm = () => {
	const custom = useAppSelector(selectCustom);
	const dispatch = useAppDispatch();
	const { descriptions } = custom;
	const form = 'custom';

	const handleCustomChange = (field: 'descriptions', value: string[]) => {
		dispatch(changeCustom({ field, value }));
	};
	return (
		<Form className='mb-14' form={form}>
			<div className='grid gap-3'>
				<Label htmlFor='summary'>Custom Textbox</Label>
				<Textarea
					id='descriptions'
					name='descriptions'
					placeholder='Description'
					className='min-h-[9.5rem]'
					value={descriptions}
					onChange={(e) => handleCustomChange('descriptions', [e.target.value])}
				/>
			</div>
		</Form>
	);
};
