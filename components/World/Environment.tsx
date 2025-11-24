/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React from 'react';
import { useStore } from '../../store';
import CoastalRunEnvironment from './Environments/CoastalRunEnvironment';
import VolcanicRealmEnvironment from './Environments/VolcanicRealmEnvironment';
import SnowyWonderlandEnvironment from './Environments/SnowyWonderlandEnvironment';
import WildwoodEnvironment from './Environments/WildwoodEnvironment';

export const Environment: React.FC = () => {
  const visualLevel = useStore(state => state.visualLevel);
  
  return (
    <>
      {visualLevel === 1 && <CoastalRunEnvironment />}
      {visualLevel === 2 && <VolcanicRealmEnvironment />}
      {visualLevel === 3 && <SnowyWonderlandEnvironment />}
      {visualLevel === 4 && <WildwoodEnvironment />}
    </>
  );
};