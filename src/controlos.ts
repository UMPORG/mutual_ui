"use client";

/**
 * `@umporg/ui/controlos` — interactive controls built on @base-ui/react
 * (optional peer dependency, ≥ 1.6). Import only from client components.
 *
 * Server-safe pieces (Button, FormField, Input, Badge, Stepper…) live in the
 * main entry `@umporg/ui`; dates in `@umporg/ui/datas`.
 */
export { Select, Combobox, MultiSelect, type Option, type OptionGroup, type SelectProps, type ComboboxProps, type MultiSelectProps } from "./selecao";
export { DropdownMenu, ContextMenu, type MenuEntry, type DropdownMenuProps, type ContextMenuProps } from "./menus";
export {
  Tooltip,
  TooltipProvider,
  Popover,
  Dialog,
  DialogClose,
  ConfirmDialog,
  Sheet,
  type DialogProps,
  type ConfirmDialogProps,
  type SheetProps,
} from "./sobreposicoes";
export { Accordion, Collapsible, Tabs, useUrlParam, type AccordionItem, type TabItem } from "./divulgacao";
export { Switch, Checkbox, RadioGroup, RadioCards, SegmentedControl, Slider, NumberField, type RadioOption } from "./escolhas";
export { Toaster, toast, type ToastOptions } from "./avisos";
export { ScrollArea, Avatar, AvatarGroup, iniciais } from "./diversos";
