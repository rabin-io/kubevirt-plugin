import * as React from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { useKubevirtTranslation } from '@kubevirt-utils/hooks/useKubevirtTranslation';
import {
  FormGroup,
  Select,
  SelectOption,
  SelectVariant,
  ValidatedOptions,
} from '@patternfly/react-core';

import { filter } from './utils';

type PersistentVolumeSelectNameProps = {
  isDisabled: boolean;
  pvcNameSelected: string;
  pvcNames: string[];
  onChange: (newPVCName: string) => void;
  'data-test-id': string;
};

export const PersistentVolumeSelectName: React.FC<PersistentVolumeSelectNameProps> = ({
  isDisabled,
  pvcNameSelected,
  pvcNames,
  onChange: onPvcNameChange,
  'data-test-id': testId,
}) => {
  const { t } = useKubevirtTranslation();
  const { control } = useFormContext();
  const [isOpen, setSelectOpen] = React.useState(false);

  const onSelect = React.useCallback(
    (event, selection) => {
      onPvcNameChange(selection);
      setSelectOpen(false);
    },
    [onPvcNameChange],
  );

  return (
    <FormGroup
      label={t('Persistent Volume Claim name')}
      fieldId={testId}
      id={testId}
      isRequired
      className="pvc-selection-formgroup"
    >
      <Controller
        name="pvcNamespace"
        control={control}
        rules={{ required: true }}
        render={({ field: { onChange }, fieldState: { error } }) => (
          <div data-test-id={`${testId}-dropdown`}>
            <Select
              aria-labelledby={testId}
              isOpen={isOpen}
              onToggle={() => setSelectOpen(!isOpen)}
              onSelect={(e, v) => {
                onSelect(e, v);
                onChange(v);
              }}
              variant={SelectVariant.typeahead}
              selections={pvcNameSelected}
              onFilter={filter(pvcNames)}
              placeholderText={t('--- Select PersistentVolumeClaim name ---')}
              isDisabled={isDisabled}
              validated={error ? ValidatedOptions.error : ValidatedOptions.default}
              aria-invalid={error ? true : false}
              maxHeight={400}
              data-test-id={`${testId}-dropdown`}
              toggleId={`${testId}-toggle`}
            >
              {pvcNames.map((name) => (
                <SelectOption
                  key={name}
                  value={name}
                  data-test-id={`${testId}-dropdown-option-${pvcNames}`}
                />
              ))}
            </Select>
          </div>
        )}
      />
    </FormGroup>
  );
};
