import { V1beta1DataVolume } from '@kubevirt-ui/kubevirt-api/containerized-data-importer/models';
import { OS_NAME_TYPES } from '@kubevirt-utils/resources/template';

export type TabsData = {
  additionalObjects?: any[];
  disks?: {
    dataVolumesToAddOwnerRef?: V1beta1DataVolume[];
  };
  overview?: {
    templateMetadata?: {
      displayName?: string;
      name?: string;
      namespace?: string;
      osType?: OS_NAME_TYPES;
    };
  };
  startVM?: boolean;
};
