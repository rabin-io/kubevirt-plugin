import React from 'react';

import { Overview } from '@openshift-console/dynamic-plugin-sdk';
import { Grid, GridItem } from '@patternfly/react-core';

import OverviewAlertsCard from './alerts-card/OverviewAlertsCard';
import GettingStartedCard from './getting-started-card/GettingStartedCard';
import ChartsCard from './metric-charts-card/components/ChartsCard';
import VMStatusesCard from './vm-statuses-card/VMStatusesCard';
import VMsPerTemplateCard from './vms-per-template-card/VMsPerTemplateCard';

const OverviewTab: React.FC = () => {
  return (
    <Overview>
      <GettingStartedCard />
      <ChartsCard />
      <OverviewAlertsCard />
      <Grid hasGutter>
        <GridItem span={6}>
          <VMStatusesCard />
        </GridItem>
        <GridItem span={6}>
          <VMsPerTemplateCard />
        </GridItem>
      </Grid>
    </Overview>
  );
};

export default OverviewTab;
