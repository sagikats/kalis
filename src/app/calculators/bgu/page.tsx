import { redirect } from 'next/navigation';

export default function BguCalculatorLegacyRedirect() {
     redirect('/calculators?inst=bgu');
}
