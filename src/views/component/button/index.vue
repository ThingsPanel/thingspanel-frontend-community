<script setup lang="ts">
import type { ButtonProps } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import { $t } from '@/locales';

interface ButtonDetail {
  id: number;
  props: ButtonProps & { href?: string; target?: string };
  label?: string;
  icon?: string;
}

interface ButtonExample {
  id: number;
  label: string;
  buttons: ButtonDetail[];
  desc?: string;
}

const { loading, startLoading, endLoading } = useLoading();

const buttonExample: ButtonExample[] = [
  {
    id: 0,
    label: $t('common.base'),
    buttons: [
      {
        id: 0,
        props: {},
        label: 'Default'
      },
      {
        id: 1,
        props: { type: 'tertiary' },
        label: 'Tertiary'
      },
      {
        id: 2,
        props: { type: 'primary' },
        label: 'Primary'
      },
      {
        id: 3,
        props: { type: 'info' },
        label: 'Info'
      },
      {
        id: 4,
        props: { type: 'success' },
        label: 'Success'
      },
      {
        id: 5,
        props: { type: 'warning' },
        label: 'Warning'
      },
      {
        id: 6,
        props: { type: 'error' },
        label: 'Error'
      }
    ],
    desc: $t('card.buttonTypeDesc')
  },
  {
    id: 1,
    label: $t('card.secondaryButton'),
    buttons: [
      {
        id: 0,
        props: { strong: true, secondary: true },
        label: 'Default'
      },
      {
        id: 1,
        props: { strong: true, secondary: true, type: 'tertiary' },
        label: 'Tertiary'
      },
      {
        id: 2,
        props: { strong: true, secondary: true, type: 'primary' },
        label: 'Primary'
      },
      {
        id: 3,
        props: { strong: true, secondary: true, type: 'info' },
        label: 'Info'
      },
      {
        id: 4,
        props: { strong: true, secondary: true, type: 'success' },
        label: 'Success'
      },
      {
        id: 5,
        props: { strong: true, secondary: true, type: 'warning' },
        label: 'Warning'
      },
      {
        id: 6,
        props: { strong: true, secondary: true, type: 'error' },
        label: 'Error'
      },
      {
        id: 7,
        props: { strong: true, secondary: true, round: true },
        label: 'Default'
      },
      {
        id: 8,
        props: { strong: true, secondary: true, round: true, type: 'tertiary' },
        label: 'Tertiary'
      },
      {
        id: 9,
        props: { strong: true, secondary: true, round: true, type: 'primary' },
        label: 'Primary'
      },
      {
        id: 10,
        props: { strong: true, secondary: true, round: true, type: 'info' },
        label: 'Info'
      },
      {
        id: 11,
        props: { strong: true, secondary: true, round: true, type: 'success' },
        label: 'Success'
      },
      {
        id: 12,
        props: { strong: true, secondary: true, round: true, type: 'warning' },
        label: 'Warning'
      },
      {
        id: 13,
        props: { strong: true, secondary: true, round: true, type: 'error' },
        label: 'Error'
      }
    ]
  },
  {
    id: 2,
    label: $t('card.tertiaryButton'),
    buttons: [
      {
        id: 0,
        props: { tertiary: true },
        label: 'Default'
      },
      {
        id: 1,
        props: { tertiary: true, type: 'primary' },
        label: 'Primary'
      },
      {
        id: 2,
        props: { tertiary: true, type: 'info' },
        label: 'Info'
      },
      {
        id: 3,
        props: { tertiary: true, type: 'success' },
        label: 'Success'
      },
      {
        id: 4,
        props: { tertiary: true, type: 'warning' },
        label: 'Warning'
      },
      {
        id: 5,
        props: { tertiary: true, type: 'error' },
        label: 'Error'
      },
      {
        id: 6,
        props: { tertiary: true, round: true },
        label: 'Default'
      },
      {
        id: 7,
        props: { tertiary: true, round: true, type: 'primary' },
        label: 'Primary'
      },
      {
        id: 8,
        props: { tertiary: true, round: true, type: 'info' },
        label: 'Info'
      },
      {
        id: 9,
        props: { tertiary: true, round: true, type: 'success' },
        label: 'Success'
      },
      {
        id: 10,
        props: { tertiary: true, round: true, type: 'warning' },
        label: 'Warning'
      },
      {
        id: 11,
        props: { tertiary: true, round: true, type: 'error' },
        label: 'Error'
      }
    ]
  },
  {
    id: 3,
    label: $t('card.subsequentlyButton'),
    buttons: [
      {
        id: 0,
        props: { quaternary: true },
        label: 'Default'
      },
      {
        id: 1,
        props: { quaternary: true, type: 'primary' },
        label: 'Primary'
      },
      {
        id: 2,
        props: { quaternary: true, type: 'info' },
        label: 'Info'
      },
      {
        id: 3,
        props: { quaternary: true, type: 'success' },
        label: 'Success'
      },
      {
        id: 4,
        props: { quaternary: true, type: 'warning' },
        label: 'Warning'
      },
      {
        id: 5,
        props: { quaternary: true, type: 'error' },
        label: 'Error'
      },
      {
        id: 6,
        props: { quaternary: true, round: true },
        label: 'Default'
      },
      {
        id: 7,
        props: { quaternary: true, round: true, type: 'primary' },
        label: 'Primary'
      },
      {
        id: 8,
        props: { quaternary: true, round: true, type: 'info' },
        label: 'Info'
      },
      {
        id: 9,
        props: { quaternary: true, round: true, type: 'success' },
        label: 'Success'
      },
      {
        id: 10,
        props: { quaternary: true, round: true, type: 'warning' },
        label: 'Warning'
      },
      {
        id: 11,
        props: { quaternary: true, round: true, type: 'error' },
        label: 'Error'
      }
    ]
  },
  {
    id: 4,
    label: $t('card.dashLineButton'),
    buttons: [
      {
        id: 0,
        props: { dashed: true },
        label: 'Default'
      },
      {
        id: 1,
        props: { dashed: true, type: 'tertiary' },
        label: 'Tertiary'
      },
      {
        id: 2,
        props: { dashed: true, type: 'primary' },
        label: 'Primary'
      },
      {
        id: 3,
        props: { dashed: true, type: 'info' },
        label: 'Info'
      },
      {
        id: 4,
        props: { dashed: true, type: 'success' },
        label: 'Success'
      },
      {
        id: 5,
        props: { dashed: true, type: 'warning' },
        label: 'Warning'
      },
      {
        id: 6,
        props: { dashed: true, type: 'error' },
        label: 'Error'
      }
    ]
  },
  {
    id: 5,
    label: $t('card.size'),
    buttons: [
      {
        id: 0,
        props: { size: 'tiny', strong: true },
        label: $t('card.extremeSmall')
      },
      {
        id: 1,
        props: { size: 'small', strong: true },
        label: $t('card.small')
      },
      {
        id: 2,
        props: { size: 'medium', strong: true },
        label: $t('card.large')
      },
      {
        id: 3,
        props: { size: 'large', strong: true },
        label: $t('card.extremeLarge')
      }
    ]
  },
  {
    id: 6,
    label: $t('card.textButton'),
    buttons: [
      {
        id: 0,
        props: { text: true },
        label: $t('card.carHeadSmoke'),
        icon: 'mdi:train'
      }
    ]
  },
  {
    id: 7,
    label: $t('card.customButton'),
    buttons: [
      {
        id: 0,
        props: {
          text: true,
          tag: 'a',
          href: 'https://github.com/honghuangdc/soybean-admin',
          target: '_blank',
          type: 'primary'
        },
        label: 'soybean-admin'
      }
    ],
    desc: $t('card.renderButton')
  },
  {
    id: 8,
    label: $t('card.disabledButton'),
    buttons: [
      {
        id: 0,
        props: {
          disabled: true
        },
        label: $t('card.dontClick')
      }
    ],
    desc: $t('card.buttonDisabled')
  },
  {
    id: 9,
    label: $t('card.iconButton'),
    buttons: [
      {
        id: 0,
        props: {
          secondary: true,
          strong: true
        },
        label: $t('card.rmbYuan'),
        icon: 'mdi:cash-100'
      },
      {
        id: 0,
        props: {
          iconPlacement: 'right',
          secondary: true,
          strong: true
        },
        label: $t('card.rmbYuan'),
        icon: 'mdi:cash-100'
      }
    ],
    desc: $t('card.useIconButton')
  },
  {
    id: 10,
    label: $t('card.differentShapeButton'),
    buttons: [
      {
        id: 0,
        props: {
          circle: true
        },
        icon: 'mdi:cash-100'
      },
      {
        id: 1,
        props: {
          round: true
        },
        label: $t('card.roundCorner')
      },
      {
        id: 2,
        props: {},
        label: $t('card.square')
      }
    ],
    desc: $t('card.buttonWithDifferentShape')
  },
  {
    id: 11,
    label: $t('card.transparentBgButton'),
    buttons: [
      {
        id: 0,
        props: { ghost: true },
        label: 'Default'
      },
      {
        id: 1,
        props: { ghost: true, type: 'tertiary' },
        label: 'Tertiary'
      },
      {
        id: 2,
        props: { ghost: true, type: 'primary' },
        label: 'Primary'
      },
      {
        id: 3,
        props: { ghost: true, type: 'info' },
        label: 'Info'
      },
      {
        id: 4,
        props: { ghost: true, type: 'success' },
        label: 'Success'
      },
      {
        id: 5,
        props: { ghost: true, type: 'warning' },
        label: 'Warning'
      },
      {
        id: 6,
        props: { ghost: true, type: 'error' },
        label: 'Error'
      }
    ],
    desc: $t('card.ghostButton')
  },
  {
    id: 12,
    label: $t('card.customColor'),
    buttons: [
      {
        id: 0,
        props: {
          color: '#8a2be2'
        },
        label: '#8a2be2',
        icon: 'ic:baseline-color-lens'
      },
      {
        id: 1,
        props: {
          color: '#ff69b4'
        },
        label: '#ff69b4',
        icon: 'ic:baseline-color-lens'
      },
      {
        id: 2,
        props: {
          color: '#8a2be2',
          ghost: true
        },
        label: '#8a2be2',
        icon: 'ic:baseline-color-lens'
      },
      {
        id: 3,
        props: {
          color: '#ff69b4',
          ghost: true
        },
        label: '#ff69b4',
        icon: 'ic:baseline-color-lens'
      },
      {
        id: 4,
        props: {
          color: '#8a2be2',
          text: true
        },
        label: '#8a2be2',
        icon: 'ic:baseline-color-lens'
      },
      {
        id: 5,
        props: {
          color: '#ff69b4',
          text: true
        },
        label: '#ff69b4',
        icon: 'ic:baseline-color-lens'
      }
    ],
    desc: '这两个颜色看起来像毒蘑菇。'
  }
];
</script>

<template>
  <div>
    <NCard :title="$t('page.manage.menu.button')" :bordered="false" class="h-full rounded-8px shadow-sm">
      <NGrid cols="s:1 m:2" responsive="screen" :x-gap="16" :y-gap="16">
        <NGridItem v-for="item in buttonExample" :key="item.id">
          <NCard :title="item.label" class="min-h-180px">
            <p v-if="item.desc" class="pb-16px">{{ item.desc }}</p>
            <NSpace>
              <NButton
                v-for="button in item.buttons"
                :key="button.id"
                v-bind="button.props"
                :style="`--icon-margin: ${button.props.circle ? 0 : 6}px`"
              >
                <template v-if="button.icon" #icon>
                  <SvgIcon :icon="button.icon" />
                </template>
                {{ button.label }}
              </NButton>
            </NSpace>
          </NCard>
        </NGridItem>
        <NGridItem class="h-180px">
          <NCard :title="$t('generate.loading')" class="h-full">
            <p class="pb-16px">{{ $t('generate.loading-button') }}</p>
            <NSpace>
              <NButton :loading="loading" type="primary" @click="startLoading">
                {{ $t('generate.start-loading') }}
              </NButton>
              <NButton @click="endLoading">{{ $t('generate.cancel-loading') }}</NButton>
            </NSpace>
          </NCard>
        </NGridItem>
      </NGrid>
    </NCard>
  </div>
</template>

<style scoped></style>
