import React, { useEffect, useState } from 'react';
import { Trans } from 'react-i18next';

import {
  HyperConvergedModelGroupVersionKind,
  modelToGroupVersionKind,
  ProjectModel,
} from '@kubevirt-ui/kubevirt-api/console';
import CreateProjectModal from '@kubevirt-utils/components/CreateProjectModal/CreateProjectModal';
import { useModal } from '@kubevirt-utils/components/ModalProvider/ModalProvider';
import { useKubevirtTranslation } from '@kubevirt-utils/hooks/useKubevirtTranslation';
import {
  K8sResourceCommon,
  ResourceLink,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  Alert,
  AlertVariant,
  Button,
  ButtonVariant,
  Select,
  SelectOption,
  SelectVariant,
  Skeleton,
  Spinner,
  Text,
  TextVariants,
} from '@patternfly/react-core';

import { HyperConverged } from '../../utils/types';
import { getHyperConvergedObject } from '../../utils/utils';

import {
  getCurrentTemplatesNamespaceFromHCO,
  OPENSHIFT,
  updateHCOCommonTemplatesNamespace,
} from './utils/utils';

import './templates-project-tab.scss';

const TemplatesProjectTab = () => {
  const { t } = useKubevirtTranslation();
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<string>();
  const [error, setError] = useState<string>();
  const { createModal } = useModal();

  const [projects, projectsLoaded, projectsLoadingError] = useK8sWatchResource<K8sResourceCommon[]>(
    {
      groupVersionKind: modelToGroupVersionKind(ProjectModel),
      isList: true,
    },
  );

  const [hyperConvergeData, hyperLoaded, hyperLoadingError] = useK8sWatchResource<HyperConverged[]>(
    {
      groupVersionKind: HyperConvergedModelGroupVersionKind,
      isList: true,
    },
  );

  useEffect(() => {
    const hyperConvergeObject = getHyperConvergedObject(hyperConvergeData);
    if (hyperConvergeObject) {
      const currentNamespaceHCO = getCurrentTemplatesNamespaceFromHCO(hyperConvergeObject);
      !selectedProject && setSelectedProject(currentNamespaceHCO ?? OPENSHIFT);
    }
  }, [hyperConvergeData, selectedProject]);

  const onSelect = (
    _event: React.ChangeEvent<Element> | React.MouseEvent<Element, MouseEvent>,
    value: string,
  ) => {
    setIsOpen(false);
    setSelectedProject(value);
    updateHCOCommonTemplatesNamespace(
      getHyperConvergedObject(hyperConvergeData),
      value,
      setError,
      setLoading,
    ).catch((e) => console.log(e));
  };

  const onFilter = (_event: React.ChangeEvent<HTMLInputElement>, value: string) => {
    const filteredProjects = projects.filter((project) => project?.metadata?.name?.includes(value));
    return filteredProjects?.map((project) => (
      <SelectOption key={project?.metadata?.name} value={project?.metadata?.name}>
        <ResourceLink kind={ProjectModel.kind} linkTo={false} name={project?.metadata?.name} />
      </SelectOption>
    ));
  };

  return (
    <div className="templates-project-tab__main">
      <Text className="templates-project-tab__main--help" component={TextVariants.small}>
        <Trans ns="plugin__kubevirt-plugin" t={t}>
          Set the project to nest Red Hat templates in. If a project is not selected, the settings
          defaults to &apos;openshift&apos;.
          <br />
          To nest Red Hat templates in more than one project, use the clone template action from the
          Templates kebab actions.
        </Trans>
      </Text>
      <Text className="templates-project-tab__main--field-title" component={TextVariants.h6}>
        {t('Project')}
      </Text>
      {projectsLoaded && hyperLoaded ? (
        <Select
          footer={
            <Button
              onClick={() =>
                createModal((props) => (
                  <CreateProjectModal
                    {...props}
                    createdProject={(value) =>
                      value?.metadata?.name && setSelectedProject(value?.metadata?.name)
                    }
                  />
                ))
              }
              variant={ButtonVariant.secondary}
            >
              {t('Create project')}
            </Button>
          }
          hasInlineFilter
          id="project"
          inlineFilterPlaceholderText={t('Search project')}
          isDisabled={loading}
          isOpen={isOpen}
          maxHeight={400}
          onFilter={onFilter}
          onSelect={onSelect}
          onToggle={setIsOpen}
          selections={selectedProject}
          toggleIcon={loading && <Spinner isSVG size="sm" />}
          variant={SelectVariant.single}
          width={300}
        >
          {projects?.map((project) => (
            <SelectOption key={project?.metadata?.name} value={project?.metadata?.name}>
              <ResourceLink
                kind={ProjectModel.kind}
                linkTo={false}
                name={project?.metadata?.name}
              />
            </SelectOption>
          ))}
        </Select>
      ) : (
        <Skeleton width={'300px'} />
      )}
      {(error || projectsLoadingError || hyperLoadingError) && (
        <Alert
          className="templates-project-tab__main--error"
          isInline
          title={t('Error')}
          variant={AlertVariant.danger}
        >
          {error || projectsLoadingError || hyperLoadingError}
        </Alert>
      )}
    </div>
  );
};

export default TemplatesProjectTab;
