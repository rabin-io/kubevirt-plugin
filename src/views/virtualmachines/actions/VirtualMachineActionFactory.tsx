import React from 'react';
import { Location, NavigateFunction } from 'react-router-dom-v5-compat';

import VirtualMachineCloneModel from '@kubevirt-ui/kubevirt-api/console/models/VirtualMachineCloneModel';
import VirtualMachineInstanceMigrationModel from '@kubevirt-ui/kubevirt-api/console/models/VirtualMachineInstanceMigrationModel';
import VirtualMachineModel from '@kubevirt-ui/kubevirt-api/console/models/VirtualMachineModel';
import VirtualMachineSnapshotModel from '@kubevirt-ui/kubevirt-api/console/models/VirtualMachineSnapshotModel';
import {
  V1VirtualMachine,
  V1VirtualMachineInstanceMigration,
} from '@kubevirt-ui/kubevirt-api/kubevirt';
import { ActionDropdownItemType } from '@kubevirt-utils/components/ActionsDropdown/constants';
import { AnnotationsModal } from '@kubevirt-utils/components/AnnotationsModal/AnnotationsModal';
import CloneVMModal from '@kubevirt-utils/components/CloneVMModal/CloneVMModal';
import { LabelsModal } from '@kubevirt-utils/components/LabelsModal/LabelsModal';
import { ModalComponent } from '@kubevirt-utils/components/ModalProvider/ModalProvider';
import SnapshotModal from '@kubevirt-utils/components/SnapshotModal/SnapshotModal';
import { t } from '@kubevirt-utils/hooks/useKubevirtTranslation';
import { asAccessReview, getNamespace, getResourceUrl } from '@kubevirt-utils/resources/shared';
import { getVMSSHSecretName } from '@kubevirt-utils/resources/vm';
import { isEmpty } from '@kubevirt-utils/utils/utils';
import { Action, k8sPatch } from '@openshift-console/dynamic-plugin-sdk';
import { CopyIcon } from '@patternfly/react-icons';

import { isLiveMigratable, isRestoring, isSnapshotting, printableVMStatus } from '../utils';

import DeleteVMModal from './components/DeleteVMModal/DeleteVMModal';
import {
  cancelMigration,
  migrateVM,
  pauseVM,
  restartVM,
  startVM,
  stopVM,
  unpauseVM,
} from './actions';

const {
  Migrating,
  Paused,
  Provisioning,
  Running,
  Starting,
  Stopped,
  Stopping,
  Terminating,
  Unknown,
} = printableVMStatus;

export const VirtualMachineActionFactory = {
  cancelMigrationCompute: (
    vm: V1VirtualMachine,
    vmim: V1VirtualMachineInstanceMigration,
    isSingleNodeCluster: boolean,
  ): Action => {
    return {
      accessReview: {
        group: VirtualMachineInstanceMigrationModel.apiGroup,
        namespace: vm?.metadata?.namespace,
        resource: VirtualMachineInstanceMigrationModel.plural,
        verb: 'delete',
      },
      cta: () => cancelMigration(vmim),
      description: !!vmim?.metadata?.deletionTimestamp && t('Canceling ongoing migration'),
      disabled: isSingleNodeCluster || !vmim || !!vmim?.metadata?.deletionTimestamp,
      id: 'vm-action-cancel-migrate',
      label: t('Cancel migration'),
    };
  },
  clone: (vm: V1VirtualMachine, createModal: (modal: ModalComponent) => void): Action => {
    return {
      accessReview: asAccessReview(VirtualMachineCloneModel, vm, 'create'),
      cta: () =>
        createModal(({ isOpen, onClose }) => (
          <CloneVMModal isOpen={isOpen} onClose={onClose} source={vm} />
        )),
      id: 'vm-action-clone',
      label: t('Clone'),
    };
  },
  copySSHCommand: (vm: V1VirtualMachine, command: string): Action => {
    return {
      accessReview: asAccessReview(VirtualMachineModel, vm, 'patch'),
      cta: () => command && navigator.clipboard.writeText(command),
      description: t('SSH using virtctl'),
      disabled: isEmpty(getVMSSHSecretName(vm)),
      icon: <CopyIcon />,
      id: 'vm-action-copy-ssh',
      label: t('Copy SSH command'),
    };
  },
  delete: (vm: V1VirtualMachine, createModal: (modal: ModalComponent) => void): Action => {
    return {
      accessReview: asAccessReview(VirtualMachineModel, vm, 'delete'),
      cta: () =>
        createModal(({ isOpen, onClose }) => (
          <DeleteVMModal isOpen={isOpen} onClose={onClose} vm={vm} />
        )),
      disabled: false,
      id: 'vm-action-delete',
      label: t('Delete'),
    };
  },
  editAnnotations: (vm: V1VirtualMachine, createModal: (modal: ModalComponent) => void): Action => {
    return {
      accessReview: asAccessReview(VirtualMachineModel, vm, 'patch'),
      cta: () =>
        createModal(({ isOpen, onClose }) => (
          <AnnotationsModal
            onSubmit={(updatedAnnotations) =>
              k8sPatch({
                data: [
                  {
                    op: 'replace',
                    path: '/metadata/annotations',
                    value: updatedAnnotations,
                  },
                ],
                model: VirtualMachineModel,
                resource: vm,
              })
            }
            isOpen={isOpen}
            obj={vm}
            onClose={onClose}
          />
        )),
      disabled: false,
      id: 'vm-action-edit-annotations',
      label: t('Edit annotations'),
    };
  },

  editLabels: (vm: V1VirtualMachine, createModal: (modal: ModalComponent) => void): Action => {
    return {
      accessReview: asAccessReview(VirtualMachineModel, vm, 'patch'),
      cta: () =>
        createModal(({ isOpen, onClose }) => (
          <LabelsModal
            onLabelsSubmit={(labels) =>
              k8sPatch({
                data: [
                  {
                    op: 'replace',
                    path: '/metadata/labels',
                    value: labels,
                  },
                ],
                model: VirtualMachineModel,
                resource: vm,
              })
            }
            isOpen={isOpen}
            obj={vm}
            onClose={onClose}
          />
        )),
      disabled: false,
      id: 'vm-action-edit-labels',
      label: t('Edit labels'),
    };
  },
  forceStop: (vm: V1VirtualMachine): Action => {
    return {
      accessReview: asAccessReview(VirtualMachineModel, vm, 'patch'),
      cta: () =>
        stopVM(vm, {
          gracePeriod: 0,
        }),
      disabled: [Migrating, Provisioning, Stopped, Unknown].includes(vm?.status?.printableStatus),
      id: 'vm-action-force-stop',
      label: t('Force stop'),
    };
  },
  migrateCompute: (vm: V1VirtualMachine, isSingleNodeCluster: boolean): Action => {
    return {
      accessReview: {
        group: VirtualMachineInstanceMigrationModel.apiGroup,
        namespace: vm?.metadata?.namespace,
        resource: VirtualMachineInstanceMigrationModel.plural,
        verb: 'create',
      },
      cta: () => migrateVM(vm),
      description: t('Migrate VirtualMachine to a different Node'),
      disabled: !isLiveMigratable(vm, isSingleNodeCluster),
      id: 'vm-action-migrate',
      label: t('Compute'),
    };
  },
  migrateStorage: (
    vm: V1VirtualMachine,
    navigate: NavigateFunction,
    location: Location,
  ): Action => {
    return {
      accessReview: {
        group: VirtualMachineModel.apiGroup,
        namespace: getNamespace(vm),
        resource: VirtualMachineModel.plural,
        verb: 'patch',
      },
      cta: () =>
        navigate(
          `${getResourceUrl({
            model: VirtualMachineModel,
            resource: vm,
          })}/migratestorage?fromURL=${encodeURIComponent(
            `${location.pathname}${location.search}`,
          )}`,
        ),
      description: t('Migrate VirtualMachine storage to a different StorageClass'),
      id: 'vm-migrate-storage',
      label: t('Storage'),
    };
  },
  migrationActions: (...migrationActions): ActionDropdownItemType => ({
    id: 'migration-menu',
    label: 'Migration',
    options: migrationActions,
  }),
  pause: (vm: V1VirtualMachine): Action => {
    return {
      accessReview: asAccessReview(VirtualMachineModel, vm, 'patch'),
      cta: () => pauseVM(vm),
      disabled: vm?.status?.printableStatus !== Running || isSnapshotting(vm) || isRestoring(vm),
      id: 'vm-action-pause',
      label: t('Pause'),
    };
  },
  restart: (vm: V1VirtualMachine): Action => {
    return {
      accessReview: asAccessReview(VirtualMachineModel, vm, 'patch'),
      cta: () => restartVM(vm),
      disabled:
        [Migrating, Provisioning, Stopped, Stopping, Terminating, Unknown].includes(
          vm?.status?.printableStatus,
        ) ||
        isSnapshotting(vm) ||
        isRestoring(vm),
      id: 'vm-action-restart',
      label: t('Restart'),
    };
  },
  snapshot: (vm: V1VirtualMachine, createModal: (modal: ModalComponent) => void): Action => {
    return {
      accessReview: asAccessReview(VirtualMachineSnapshotModel, vm, 'create'),
      cta: () => createModal((props) => <SnapshotModal vm={vm} {...props} />),
      id: 'vm-action-snapshot',
      label: t('Take snapshot'),
    };
  },
  start: (vm: V1VirtualMachine): Action => {
    return {
      accessReview: asAccessReview(VirtualMachineModel, vm, 'patch'),
      cta: () => startVM(vm),
      disabled:
        [Migrating, Provisioning, Running, Starting, Stopping, Terminating, Unknown].includes(
          vm?.status?.printableStatus,
        ) ||
        isSnapshotting(vm) ||
        isRestoring(vm),
      id: 'vm-action-start',
      label: t('Start'),
    };
  },
  stop: (vm: V1VirtualMachine): Action => {
    return {
      accessReview: asAccessReview(VirtualMachineModel, vm, 'patch'),
      cta: () => stopVM(vm),
      disabled:
        [Provisioning, Stopped, Stopping, Terminating, Unknown].includes(
          vm?.status?.printableStatus,
        ) ||
        isSnapshotting(vm) ||
        isRestoring(vm),
      id: 'vm-action-stop',
      label: t('Stop'),
    };
  },
  unpause: (vm: V1VirtualMachine): Action => {
    return {
      accessReview: asAccessReview(VirtualMachineModel, vm, 'patch'),
      cta: () => unpauseVM(vm),
      disabled: vm?.status?.printableStatus !== Paused,
      id: 'vm-action-unpause',
      label: t('Unpause'),
    };
  },
};
