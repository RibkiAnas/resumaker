import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '~/components/ui/accordion';

export const Faqs = () => {
	return (
		<div className='grid gap-12 lg:grid-cols-3'>
			<div className='space-y-6'>
				<h2 className='text-4xl font-bold'>Frequently Asked Questions</h2>
				<p className='text-md leading-loose'>
					Here are some questions I often get asked about Reactive Resume.
				</p>
			</div>
			<div className='col-span-2'>
				<Accordion className='border rounded-lg px-4' type='single' collapsible>
					<AccordionItem className='text-md border-none' value='item-1'>
						<AccordionTrigger>
							Why is a Resumaker better than a resume template document?
						</AccordionTrigger>
						<AccordionContent>
							Today, you have two primary methods for crafting a resume. The
							first method involves selecting a pre-designed template, like
							those available in office or Google Docs, and tailoring it to fit
							your profile. Alternatively, you can opt for a resume builder, a
							web-based service that gathers your details and crafts a resume on
							your behalf.
							<br />
							<br />
							Opting for a template means you’ll engage in hands-on formatting,
							such as transferring text blocks and tweaking the layout, which
							can be both tedious and susceptible to errors. Common issues
							include inconsistent formatting, like mismatched bullet points or
							fonts, due to the copy-paste process. Conversely, a resume
							builder, such as Resumaker, streamlines the process by handling
							the formatting for you, thus saving time and avoiding common
							errors. It also simplifies the process of altering fonts and sizes
							with just a click. To sum up, a resume builder offers a more
							user-friendly experience than manual template editing.
						</AccordionContent>
					</AccordionItem>
					<AccordionItem className='text-md border-t' value='item-2'>
						<AccordionTrigger>
							How does Resumaker distinguish itself from the multitude of resume
							builders and templates available?
						</AccordionTrigger>
						<AccordionContent>
							Resumaker tailors its features to adhere strictly to U.S job
							market standards and best practices. It simplifies the resume
							creation process by providing only essential sections and a
							single-column layout, which is optimal for Applicant Tracking
							Systems (ATS), while avoiding options like profile photos to
							eliminate bias. This focused approach ensures compliance with U.S
							employment norms.
						</AccordionContent>
					</AccordionItem>
					<AccordionItem className='text-md border-t' value='item-3'>
						<AccordionTrigger>
							In what ways can I contribute to the success and advancement of
							Resumaker?
						</AccordionTrigger>
						<AccordionContent>
							To support Resumaker, consider providing feedback via GitHub page
							by{' '}
							<a
								href='https://github.com/RibkiAnas/resumaker/issues/new'
								target='_blank'
								rel='noreferrer'
								className='underline underline-offset-2 hover:decoration-2 '
							>
								open an issue
							</a>
							, and help raise awareness by sharing it within your network and
							on social media. Engaging with the project on GitHub by{' '}
							<a
								href='https://github.com/RibkiAnas/resumaker'
								target='_blank'
								rel='noreferrer'
								className='underline underline-offset-2 hover:decoration-2 '
							>
								starring it
							</a>{' '}
							can also boost its visibility.
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</div>
		</div>
	);
};
