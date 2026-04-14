import { ADMIN_COPY } from '../content/adminContent';
import usePublicLanguage from './usePublicLanguage';

const useAdminLanguage = () => usePublicLanguage(ADMIN_COPY);

export default useAdminLanguage;
