// Claritas design-system components. Import from "@/design-system" (never from component internals —
// enforced by the adherence lint rules in design-system/lint).

// core
export { Badge, type BadgeProps, type BadgeTone } from "./core/Badge";
export { Button, type ButtonProps, type ButtonVariant, type ButtonSize } from "./core/Button";
export { Icon, ICON_NAMES, type IconProps, type IconName } from "./core/Icon";
export { IconButton, type IconButtonProps } from "./core/IconButton";
export { Panel, type PanelProps } from "./core/Panel";
export { Tooltip, type TooltipProps } from "./core/Tooltip";
export { Wordmark, type WordmarkProps } from "./core/Wordmark";
// forms
export { Checkbox, type CheckboxProps } from "./forms/Checkbox";
export { Input, type InputProps } from "./forms/Input";
export { PasswordInput, type PasswordInputProps } from "./forms/PasswordInput";
export { Select, type SelectProps, type SelectOption } from "./forms/Select";
export { Switch, type SwitchProps } from "./forms/Switch";
// navigation
export { SegmentedControl, type SegmentedControlProps, type SegmentOption } from "./navigation/SegmentedControl";
export { Tabs, type TabsProps, type TabItem } from "./navigation/Tabs";
export { TextLink, type TextLinkProps } from "./navigation/TextLink";
// feedback
export { Dialog, type DialogProps } from "./feedback/Dialog";
export { LiveIndicator, type LiveIndicatorProps, type LiveStatus } from "./feedback/LiveIndicator";
export { Toast, type ToastProps, type ToastTone } from "./feedback/Toast";
// market
export { Delta, type DeltaProps } from "./market/Delta";
export { PriceTicker, type PriceTickerProps } from "./market/PriceTicker";
export { TickerTape, type TickerTapeProps, type TapeItem } from "./market/TickerTape";
export { WatchRow, type WatchRowProps } from "./market/WatchRow";
// charts
export { CandleChart, type CandleChartProps, type Candle, type Annotation, type GenerateSeriesOptions } from "./charts/CandleChart";
export { MarketChart, type MarketChartProps, type ChartBar, type ChartLine, type ChartLevel, type ChartMarker } from "./charts/MarketChart";
export { DistributionCurve, type DistributionCurveProps } from "./charts/DistributionCurve";
export { FlowArea, type FlowAreaProps } from "./charts/FlowArea";
export { ProbabilityField, type ProbabilityFieldProps } from "./charts/ProbabilityField";
export { Sparkline, type SparklineProps } from "./charts/Sparkline";
// analysis
export { ConfidenceMeter, type ConfidenceMeterProps } from "./analysis/ConfidenceMeter";
export { MetricRow, type MetricRowProps } from "./analysis/MetricRow";
export { SentimentGauge, type SentimentGaugeProps } from "./analysis/SentimentGauge";
export { SignalCard, type SignalCardProps, type SignalLevel, type SignalKind } from "./analysis/SignalCard";
