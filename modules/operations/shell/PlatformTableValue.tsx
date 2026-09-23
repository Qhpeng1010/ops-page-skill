import { Badge, Tag, type BadgeProps } from 'antd';
import type { ReactNode } from 'react';

export type PlatformStatusDisplay = 'status' | 'text' | 'tag';
export type PlatformCategoryDisplay = 'tag' | 'text';

type PlatformStatusValueProps = {
  kind: 'status';
  display?: PlatformStatusDisplay;
  label: ReactNode;
  status?: BadgeProps['status'];
  color?: string;
};

type PlatformCategoryValueProps = {
  kind: 'category';
  display?: PlatformCategoryDisplay;
  label: ReactNode;
  color?: string;
};

export type PlatformTableValueProps = PlatformStatusValueProps | PlatformCategoryValueProps;

/**
 * Render status and category values with the platform's default semantics.
 * Status defaults to a colored status dot; categories default to an uncolored
 * Ant Tag. A category color is opt-in through the color prop.
 * Both can be changed to plain text, while statuses can also use a Tag.
 */
export function PlatformTableValue(props: PlatformTableValueProps) {
  if (props.kind === 'status') {
    if (props.display === 'text') return <span>{props.label}</span>;
    if (props.display === 'tag') return <Tag color={props.color}>{props.label}</Tag>;
    return <Badge status={props.status ?? 'default'} text={props.label} />;
  }
  return props.display === 'text' ? <span>{props.label}</span> : <Tag color={props.color}>{props.label}</Tag>;
}
