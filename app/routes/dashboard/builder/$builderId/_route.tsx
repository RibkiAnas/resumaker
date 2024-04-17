import { Provider } from 'react-redux';
import ResumeBuilder from '~/components/builder/resume-builder';
import { store } from '~/lib/redux/store';

function BuilderPage() {
	return (
		<Provider store={store}>
			<ResumeBuilder />
		</Provider>
	);
}

export default BuilderPage;
