"use client"

import * as React from "react"
import { useMemo } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import {
  Dialog as DialogPrimitive,
  Collapsible as CollapsiblePrimitive,
  RadioGroup as RadioGroupPrimitive,
  Progress as ProgressPrimitive,
  Popover as PopoverPrimitive,
  Label as LabelPrimitive,
  DropdownMenu as DropdownMenuPrimitive,
  Accordion as AccordionPrimitive,
  Checkbox as CheckboxPrimitive,
  AlertDialog as AlertDialogPrimitive,
} from "@radix-ui/react-select"
import { Slot } from "@radix-ui/react-slot" //
import { X, Circle, Check, ChevronRight, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/react-app/lib/utils"
// Importações de componentes que não estavam na sua lista:
import { Textarea } from "@/react-app/components/ui/textarea"
import { Separator } from "@/react-app/components/ui/separator"

// ============================================================================
// 1. BUTTON
// ============================================================================
const buttonVariants = cva(
  "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-4xl border border-transparent bg-clip-padding text-sm font-medium focus-visible:ring-[3px] aria-invalid:ring-[3px] [&_svg:not([class*='size-'])]:size-4 inline-flex items-center justify-center whitespace-nowrap transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none group/button select-none",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline: "border-border bg-input/30 hover:bg-input/50 hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost: "hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive: "bg-destructive/10 hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/20 text-destructive focus-visible:border-destructive/40 dark:hover:bg-destructive/30",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 gap-1.5 px-3 has-[[data-icon=inline-end]]:pr-2.5 has-[[data-icon=inline-start]]:pl-2.5",
        xs: "h-6 gap-1 px-2.5 text-xs has-[[data-icon=inline-end]]:pr-2 has-[[data-icon=inline-start]]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 px-3 has-[[data-icon=inline-end]]:pr-2 has-[[data-icon=inline-start]]:pl-2",
        lg: "h-10 gap-1.5 px-4 has-[[data-icon=inline-end]]:pr-3 has-[[data-icon=inline-start]]:pl-3",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({ className, variant = "default", size = "default", asChild = false, ...props }: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button"
  return <Comp data-slot="button" data-variant={variant} data-size={size} className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

// ============================================================================
// 2. INPUT
// ============================================================================
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input type={type} data-slot="input" className={cn("bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 h-9 rounded-4xl border px-3 py-1 text-base transition-colors file:h-7 file:text-sm file:font-medium focus-visible:ring-[3px] aria-invalid:ring-[3px] md:text-sm file:text-foreground placeholder:text-muted-foreground w-full min-w-0 outline-none file:inline-flex file:border-0 file:bg-transparent disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50", className)} {...props} />
  )
}

// ============================================================================
// 3. LABEL
// ============================================================================
function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root data-slot="label" className={cn("gap-2 text-sm leading-none font-medium group-data-[disabled=true]:opacity-50 peer-disabled:opacity-50 flex items-center select-none group-data-[disabled=true]:pointer-events-none peer-disabled:cursor-not-allowed", className)} {...props} />
  )
}

// ============================================================================
// 4. BADGE
// ============================================================================
const badgeVariants = cva(
  "h-5 gap-1 rounded-4xl border border-transparent px-2 py-0.5 text-xs font-medium transition-all has-[[data-icon=inline-end]]:pr-1.5 has-[[data-icon=inline-start]]:pl-1.5 [&>svg]:!size-3 inline-flex items-center justify-center w-fit whitespace-nowrap shrink-0 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive overflow-hidden group/badge",
  { variants: { variant: { default: "bg-primary text-primary-foreground [a&]:hover:bg-primary/80", secondary: "bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/80", destructive: "bg-destructive/10 [a&]:hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive dark:bg-destructive/20", outline: "border-border text-foreground [a&]:hover:bg-muted [a&]:hover:text-muted-foreground bg-input/30", ghost: "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50", link: "text-primary underline-offset-4 hover:underline" } }, defaultVariants: { variant: "default" } }
)
function Badge({ className, variant = "default", asChild = false, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"
  return <Comp data-slot="badge" data-variant={variant} className={cn(badgeVariants({ variant }), className)} {...props} />
}

// ============================================================================
// 5. DIALOG
// ============================================================================
function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) { return <DialogPrimitive.Root data-slot="dialog" {...props} /> }
function DialogTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) { return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} /> }
function DialogPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) { return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} /> }
function DialogClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) { return <DialogPrimitive.Close data-slot="dialog-close" {...props} /> }
function DialogOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) { return <DialogPrimitive.Overlay data-slot="dialog-overlay" className={cn("data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 bg-black/80 duration-100 supports-[backdrop-filter]:backdrop-blur-[2px] fixed inset-0 isolate z-50", className)} {...props} /> }
function DialogContent({ className, children, showCloseButton = true, ...props }: React.ComponentProps<typeof DialogPrimitive.Content> & { showCloseButton?: boolean }) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content data-slot="dialog-content" className={cn("bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 ring-foreground/5 grid max-w-[calc(100%-2rem)] gap-6 rounded-4xl p-6 text-sm ring-1 duration-100 sm:max-w-md fixed top-1/2 left-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2", className)} {...props}>
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close data-slot="dialog-close" asChild>
            <Button variant="ghost" className="absolute top-4 right-4" size="icon-sm"><X /><span className="sr-only">Close</span></Button>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}
function DialogHeader({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="dialog-header" className={cn("gap-2 flex flex-col", className)} {...props} /> }
function DialogFooter({ className, showCloseButton = false, children, ...props }: React.ComponentProps<"div"> & { showCloseButton?: boolean }) {
  return (
    <div data-slot="dialog-footer" className={cn("gap-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)} {...props}>
      {children}
      {showCloseButton && <DialogPrimitive.Close asChild><Button variant="outline">Close</Button></DialogPrimitive.Close>}
    </div>
  )
}
function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) { return <DialogPrimitive.Title data-slot="dialog-title" className={cn("text-base leading-none font-medium", className)} {...props} /> }
function DialogDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) { return <DialogPrimitive.Description data-slot="dialog-description" className={cn("text-muted-foreground [&_a]:hover:text-foreground text-sm [&_a]:underline [&_a]:underline-offset-4", className)} {...props} /> }

// ============================================================================
// 6. ALERT DIALOG
// ============================================================================
function AlertDialog({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Root>) { return <AlertDialogPrimitive.Root data-slot="alert-dialog" {...props} /> }
function AlertDialogTrigger({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Trigger>) { return <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} /> }
function AlertDialogPortal({ ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) { return <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} /> }
function AlertDialogOverlay({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Overlay>) { return <AlertDialogPrimitive.Overlay data-slot="alert-dialog-overlay" className={cn("data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 bg-black/80 duration-100 supports-[backdrop-filter]:backdrop-blur-[2px] fixed inset-0 z-50", className)} {...props} /> }
function AlertDialogContent({ className, size = "default", ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Content> & { size?: "default" | "sm" }) {
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay />
      <AlertDialogPrimitive.Content data-slot="alert-dialog-content" data-size={size} className={cn("data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 bg-background ring-foreground/5 gap-6 rounded-4xl p-6 ring-1 duration-100 data-[size=default]:max-w-xs data-[size=sm]:max-w-xs data-[size=default]:sm:max-w-md group/alert-dialog-content fixed top-1/2 left-1/2 z-50 grid w-full -translate-x-1/2 -translate-y-1/2 outline-none", className)} {...props} />
    </AlertDialogPortal>
  )
}
function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="alert-dialog-header" className={cn("grid grid-rows-[auto_1fr] place-items-center gap-1.5 text-center has-[[data-slot=alert-dialog-media]]:grid-rows-[auto_auto_1fr] has-[[data-slot=alert-dialog-media]]:gap-x-6 sm:group-data-[size=default]/alert-dialog-content:place-items-start sm:group-data-[size=default]/alert-dialog-content:text-left sm:group-data-[size=default]/alert-dialog-content:has-[[data-slot=alert-dialog-media]]:grid-rows-[auto_1fr]", className)} {...props} /> }
function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="alert-dialog-footer" className={cn("flex flex-col-reverse gap-2 group-data-[size=sm]/alert-dialog-content:grid group-data-[size=sm]/alert-dialog-content:grid-cols-2 sm:flex-row sm:justify-end", className)} {...props} /> }
function AlertDialogMedia({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="alert-dialog-media" className={cn("bg-muted mb-2 inline-flex size-16 items-center justify-center rounded-full sm:group-data-[size=default]/alert-dialog-content:row-span-2 [&_svg:not([class*='size-'])]:size-8", className)} {...props} /> }
function AlertDialogTitle({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Title>) { return <AlertDialogPrimitive.Title data-slot="alert-dialog-title" className={cn("text-lg font-medium sm:group-data-[size=default]/alert-dialog-content:group-has-[[data-slot=alert-dialog-media]]/alert-dialog-content:col-start-2", className)} {...props} /> }
function AlertDialogDescription({ className, ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Description>) { return <AlertDialogPrimitive.Description data-slot="alert-dialog-description" className={cn("text-muted-foreground [&_a]:hover:text-foreground text-sm text-balance md:text-pretty [&_a]:underline [&_a]:underline-offset-4", className)} {...props} /> }
function AlertDialogAction({ className, variant = "default", size = "default", ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Action> & Pick<React.ComponentProps<typeof Button>, "variant" | "size">) { return <Button variant={variant} size={size} asChild><AlertDialogPrimitive.Action data-slot="alert-dialog-action" className={cn(className)} {...props} /></Button> }
function AlertDialogCancel({ className, variant = "outline", size = "default", ...props }: React.ComponentProps<typeof AlertDialogPrimitive.Cancel> & Pick<React.ComponentProps<typeof Button>, "variant" | "size">) { return <Button variant={variant} size={size} asChild><AlertDialogPrimitive.Cancel data-slot="alert-dialog-cancel" className={cn(className)} {...props} /></Button> }

// ============================================================================
// 7. INPUT GROUP
// ============================================================================
function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="input-group" role="group" className={cn("border-input bg-input/30 has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 has-[[data-slot][aria-invalid=true]]:ring-destructive/20 has-[[data-slot][aria-invalid=true]]:border-destructive dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40 h-9 rounded-4xl border transition-colors has-[[data-align=block-end]]:rounded-2xl has-[[data-align=block-start]]:rounded-2xl has-[[data-slot=input-group-control]:focus-visible]:ring-[3px] has-[[data-slot][aria-invalid=true]]:ring-[3px] has-[textarea]:rounded-xl has-[[data-align=block-end]]:h-auto has-[[data-align=block-end]]:flex-col has-[[data-align=block-start]]:h-auto has-[[data-align=block-start]]:flex-col has-[[data-align=block-end]]:[&>input]:pt-3 has-[[data-align=block-start]]:[&>input]:pb-3 has-[[data-align=inline-end]]:[&>input]:pr-1.5 has-[[data-align=inline-start]]:[&>input]:pl-1.5 [[data-slot=combobox-content]_&]:focus-within:border-inherit [[data-slot=combobox-content]_&]:focus-within:ring-0 group/input-group relative flex w-full min-w-0 items-center outline-none has-[>textarea]:h-auto", className)} {...props} />
}
const inputGroupAddonVariants = cva("text-muted-foreground [&_[data-slot=kbd]]:bg-muted-foreground/10 h-auto gap-2 py-2 text-sm font-medium group-data-[disabled=true]/input-group:opacity-50 [&_[data-slot=kbd]]:rounded-4xl [&_[data-slot=kbd]]:px-1.5 [&>svg:not([class*='size-'])]:size-4 flex cursor-text items-center justify-center select-none", { variants: { align: { "inline-start": "pl-3 has-[>button]:ml-[-0.25rem] has-[>kbd]:ml-[-0.15rem] order-first", "inline-end": "pr-3 has-[>button]:mr-[-0.25rem] has-[>kbd]:mr-[-0.15rem] order-last", "block-start": "px-3 pt-3 group-has-[>input]/input-group:pt-3 [.border-b]:pb-3 order-first w-full justify-start", "block-end": "px-3 pb-3 group-has-[>input]/input-group:pb-3 [.border-t]:pt-3 order-last w-full justify-start" } }, defaultVariants: { align: "inline-start" } })
function InputGroupAddon({ className, align = "inline-start", ...props }: React.ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>) {
  return <div role="group" data-slot="input-group-addon" data-align={align} className={cn(inputGroupAddonVariants({ align }), className)} onClick={(e) => { if ((e.target as HTMLElement).closest("button")) return; e.currentTarget.parentElement?.querySelector("input")?.focus() }} {...props} />
}
const inputGroupButtonVariants = cva("gap-2 rounded-4xl text-sm shadow-none flex items-center", { variants: { size: { xs: "h-6 gap-1 px-1.5 [&>svg:not([class*='size-'])]:size-3.5", sm: "", "icon-xs": "size-6 p-0 has-[>svg]:p-0", "icon-sm": "size-8 p-0 has-[>svg]:p-0" } }, defaultVariants: { size: "xs" } })
function InputGroupButton({ className, type = "button", variant = "ghost", size = "xs", ...props }: Omit<React.ComponentProps<typeof Button>, "size"> & VariantProps<typeof inputGroupButtonVariants>) {
  return <Button type={type} data-size={size} variant={variant} className={cn(inputGroupButtonVariants({ size }), className)} {...props} />
}
function InputGroupText({ className, ...props }: React.ComponentProps<"span">) { return <span className={cn("text-muted-foreground gap-2 text-sm [&_svg:not([class*='size-'])]:size-4 flex items-center [&_svg]:pointer-events-none", className)} {...props} /> }
function InputGroupInput({ className, ...props }: React.ComponentProps<"input">) { return <Input data-slot="input-group-control" className={cn("rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent flex-1", className)} {...props} /> }
function InputGroupTextarea({ className, ...props }: React.ComponentProps<"textarea">) { return <Textarea data-slot="input-group-control" className={cn("rounded-none border-0 bg-transparent py-2 shadow-none ring-0 focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent flex-1 resize-none", className)} {...props} /> }

// ============================================================================
// 8. FIELD
// ============================================================================
function FieldSet({ className, ...props }: React.ComponentProps<"fieldset">) { return <fieldset data-slot="field-set" className={cn("gap-6 has-[[data-slot=checkbox-group]]:gap-3 has-[[data-slot=radio-group]]:gap-3 flex flex-col", className)} {...props} /> }
function FieldLegend({ className, variant = "legend", ...props }: React.ComponentProps<"legend"> & { variant?: "legend" | "label" }) { return <legend data-slot="field-legend" data-variant={variant} className={cn("mb-3 font-medium data-[variant=label]:text-sm data-[variant=legend]:text-base", className)} {...props} /> }
function FieldGroup({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="field-group" className={cn("gap-7 data-[slot=checkbox-group]:gap-3 [&>[data-slot=field-group]]:gap-4 group/field-group @container/field-group flex w-full flex-col", className)} {...props} /> }
const fieldVariants = cva("data-[invalid=true]:text-destructive gap-3 group/field flex w-full", { variants: { orientation: { vertical: "flex-col [&>*]:w-full [&>.sr-only]:w-auto", horizontal: "flex-row items-center [&>[data-slot=field-label]]:flex-auto has-[[data-slot=field-content]]:items-start has-[[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px", responsive: "flex-col [&>*]:w-full [&>.sr-only]:w-auto @md/field-group:flex-row @md/field-group:items-center @md/field-group:[&>*]:w-auto @md/field-group:[&>[data-slot=field-label]]:flex-auto @md/field-group:has-[[data-slot=field-content]]:items-start @md/field-group:has-[[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px" } }, defaultVariants: { orientation: "vertical" } })
function Field({ className, orientation = "vertical", ...props }: React.ComponentProps<"div"> & VariantProps<typeof fieldVariants>) { return <div role="group" data-slot="field" data-orientation={orientation} className={cn(fieldVariants({ orientation }), className)} {...props} /> }
function FieldContent({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="field-content" className={cn("gap-1 group/field-content flex flex-1 flex-col leading-snug", className)} {...props} /> }
function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) { return <Label data-slot="field-label" className={cn("has-[[data-state=checked]]:bg-primary/5 has-[[data-state=checked]]:border-primary/50 dark:has-[[data-state=checked]]:bg-primary/10 gap-2 group-data-[disabled=true]/field:opacity-50 has-[[data-slot=field]]:rounded-xl has-[[data-slot=field]]:border [&_[data-slot=field]]:p-4 group/field-label peer/field-label flex w-fit leading-snug has-[[data-slot=field]]:w-full has-[[data-slot=field]]:flex-col", className)} {...props} /> }
function FieldTitle({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="field-label" className={cn("gap-2 text-sm font-medium group-data-[disabled=true]/field:opacity-50 flex w-fit items-center leading-snug", className)} {...props} /> }
function FieldDescription({ className, ...props }: React.ComponentProps<"p">) { return <p data-slot="field-description" className={cn("text-muted-foreground text-left text-sm [[data-variant=legend]+&]:-mt-1.5 leading-normal font-normal group-has-[[data-orientation=horizontal]]/field:text-balance last:mt-0 [&:nth-last-child(2)]:-mt-1 [&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4", className)} {...props} /> }
function FieldSeparator({ children, className, ...props }: React.ComponentProps<"div"> & { children?: React.ReactNode }) { return <div data-slot="field-separator" data-content={!!children} className={cn("-my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2 relative", className)} {...props}><Separator className="absolute inset-0 top-1/2" />{children && <span className="text-muted-foreground px-2 bg-background relative mx-auto block w-fit" data-slot="field-separator-content">{children}</span>}</div> }
function FieldError({ className, children, errors, ...props }: React.ComponentProps<"div"> & { errors?: Array<{ message?: string } | undefined> }) {
  const content = useMemo(() => {
    if (children) return children
    if (!errors?.length) return null
    const uniqueErrors = [...new Map(errors.map((error) => [error?.message, error])).values()]
    if (uniqueErrors?.length == 1) return uniqueErrors[0]?.message
    return <ul className="ml-4 flex list-disc flex-col gap-1">{uniqueErrors.map((error, index) => error?.message && <li key={index}>{error.message}</li>)}</ul>
  }, [children, errors])
  if (!content) return null
  return <div role="alert" data-slot="field-error" className={cn("text-destructive text-sm font-normal", className)} {...props}>{content}</div>
}

// ============================================================================
// 9. PROGRESS
// ============================================================================
function Progress({ className, value, ...props }: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root data-slot="progress" className={cn("bg-muted h-3 rounded-4xl relative flex w-full items-center overflow-x-hidden", className)} {...props}>
      <ProgressPrimitive.Indicator data-slot="progress-indicator" className="bg-primary size-full flex-1 transition-all" style={{ transform: `translateX(-${100 - (value || 0)}%)` }} />
    </ProgressPrimitive.Root>
  )
}

// ============================================================================
// 10. RADIO GROUP
// ============================================================================
function RadioGroup({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Root>) { return <RadioGroupPrimitive.Root data-slot="radio-group" className={cn("grid gap-3 w-full", className)} {...props} /> }
function RadioGroupItem({ className, ...props }: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item data-slot="radio-group-item" className={cn("border-input text-primary dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary flex size-4 rounded-full transition-none focus-visible:ring-[3px] aria-invalid:ring-[3px] group/radio-group-item peer relative aspect-square shrink-0 border outline-none after:absolute after:-inset-x-3 after:-inset-y-2 disabled:cursor-not-allowed disabled:opacity-50", className)} {...props}>
      <RadioGroupPrimitive.Indicator data-slot="radio-group-indicator" className="group-aria-invalid/radio-group-item:text-destructive flex size-4 items-center justify-center text-white"><Circle className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 fill-current" /></RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  )
}

// ============================================================================
// 11. DROPDOWN MENU
// ============================================================================
function DropdownMenu({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) { return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} /> }
function DropdownMenuPortal({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) { return <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} /> }
function DropdownMenuTrigger({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) { return <DropdownMenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} /> }
function DropdownMenuContent({ className, align = "start", sideOffset = 4, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Content>) { return <DropdownMenuPrimitive.Portal><DropdownMenuPrimitive.Content data-slot="dropdown-menu-content" sideOffset={sideOffset} align={align} className={cn("data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/5 bg-popover text-popover-foreground min-w-48 rounded-2xl p-1 shadow-2xl ring-1 duration-100 z-50 max-h-[--radix-dropdown-menu-content-available-height] w-[--radix-dropdown-menu-trigger-width] origin-[--radix-dropdown-menu-content-transform-origin] overflow-x-hidden overflow-y-auto data-[state=closed]:overflow-hidden", className )} {...props} /></DropdownMenuPrimitive.Portal> }
function DropdownMenuGroup({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) { return <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} /> }
function DropdownMenuItem({ className, inset, variant = "default", ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & { inset?: boolean; variant?: "default" | "destructive" }) { return <DropdownMenuPrimitive.Item data-slot="dropdown-menu-item" data-inset={inset} data-variant={variant} className={cn("focus:bg-accent focus:text-accent-foreground data-[variant=destructive]:text-destructive data-[variant=destructive]:focus:bg-destructive/10 dark:data-[variant=destructive]:focus:bg-destructive/20 data-[variant=destructive]:focus:text-destructive data-[variant=destructive]:[&_svg]:text-destructive gap-2.5 rounded-xl px-3 py-2 text-sm [&_svg:not([class*='size-'])]:size-4 group/dropdown-menu-item relative flex cursor-default items-center outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0", className)} {...props} /> }
function DropdownMenuCheckboxItem({ className, children, checked, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>) { return <DropdownMenuPrimitive.CheckboxItem data-slot="dropdown-menu-checkbox-item" className={cn("focus:bg-accent focus:text-accent-foreground focus:[&_*]:text-accent-foreground gap-2.5 rounded-xl py-2 pr-8 pl-3 text-sm [&_svg:not([class*='size-'])]:size-4 relative flex cursor-default items-center outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0", className)} checked={checked} {...props}><span className="pointer-events-none absolute right-2 flex items-center justify-center pointer-events-none" data-slot="dropdown-menu-checkbox-item-indicator"><DropdownMenuPrimitive.ItemIndicator><Check /></DropdownMenuPrimitive.ItemIndicator></span>{children}</DropdownMenuPrimitive.CheckboxItem> }
function DropdownMenuRadioGroup({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) { return <DropdownMenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} /> }
function DropdownMenuRadioItem({ className, children, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>) { return <DropdownMenuPrimitive.RadioItem data-slot="dropdown-menu-radio-item" className={cn("focus:bg-accent focus:text-accent-foreground focus:[&_*]:text-accent-foreground gap-2.5 rounded-xl py-2 pr-8 pl-3 text-sm [&_svg:not([class*='size-'])]:size-4 relative flex cursor-default items-center outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0", className)} {...props}><span className="pointer-events-none absolute right-2 flex items-center justify-center pointer-events-none" data-slot="dropdown-menu-radio-item-indicator"><DropdownMenuPrimitive.ItemIndicator><Check /></DropdownMenuPrimitive.ItemIndicator></span>{children}</DropdownMenuPrimitive.RadioItem> }
function DropdownMenuLabel({ className, inset, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & { inset?: boolean }) { return <DropdownMenuPrimitive.Label data-slot="dropdown-menu-label" data-inset={inset} className={cn("text-muted-foreground px-3 py-2.5 text-xs data-[inset]:pl-8", className)} {...props} /> }
function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Separator>) { return <DropdownMenuPrimitive.Separator data-slot="dropdown-menu-separator" className={cn("bg-border/50 -mx-1 my-1 h-px", className)} {...props} /> }
function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<"span">) { return <span data-slot="dropdown-menu-shortcut" className={cn("text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground ml-auto text-xs tracking-widest", className)} {...props} /> }
function DropdownMenuSub({ ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) { return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} /> }
function DropdownMenuSubTrigger({ className, inset, children, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & { inset?: boolean }) { return <DropdownMenuPrimitive.SubTrigger data-slot="dropdown-menu-sub-trigger" data-inset={inset} className={cn("focus:bg-accent focus:text-accent-foreground data-[state=open]:bg-accent data-[state=open]:text-accent-foreground gap-2 rounded-xl px-3 py-2 text-sm [&_svg:not([class*='size-'])]:size-4 flex cursor-default items-center outline-none select-none data-[inset]:pl-8 [&_svg]:pointer-events-none [&_svg]:shrink-0", className)} {...props}>{children}<ChevronRight className="ml-auto" /></DropdownMenuPrimitive.SubTrigger> }
function DropdownMenuSubContent({ className, ...props }: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>) { return <DropdownMenuPrimitive.SubContent data-slot="dropdown-menu-sub-content" className={cn("data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/5 bg-popover text-popover-foreground min-w-36 rounded-2xl p-1 shadow-2xl ring-1 duration-100 z-50 origin-[--radix-dropdown-menu-content-transform-origin] overflow-hidden", className )} {...props} /> }

// ============================================================================
// 12. ACCORDION
// ============================================================================
function Accordion({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) { return <AccordionPrimitive.Root data-slot="accordion" className={cn("overflow-hidden rounded-2xl border flex w-full flex-col", className)} {...props} /> }
function AccordionItem({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Item>) { return <AccordionPrimitive.Item data-slot="accordion-item" className={cn("data-[state=open]:bg-muted/50 [&:not(:last-child)]:border-b", className)} {...props} /> }
function AccordionTrigger({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Trigger>) { return <AccordionPrimitive.Header className="flex"><AccordionPrimitive.Trigger data-slot="accordion-trigger" className={cn("[&_[data-slot=accordion-trigger-icon]]:text-muted-foreground gap-6 p-4 text-left text-sm font-medium hover:underline [&_[data-slot=accordion-trigger-icon]]:ml-auto [&_[data-slot=accordion-trigger-icon]]:size-4 group/accordion-trigger relative flex flex-1 items-start justify-between border border-transparent transition-all outline-none disabled:pointer-events-none disabled:opacity-50", className)} {...props}>{children}<ChevronDown data-slot="accordion-trigger-icon" className="pointer-events-none shrink-0 group-aria-expanded/accordion-trigger:hidden" /><ChevronUp data-slot="accordion-trigger-icon" className="pointer-events-none hidden shrink-0 group-aria-expanded/accordion-trigger:inline" /></AccordionPrimitive.Trigger></AccordionPrimitive.Header> }
function AccordionContent({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Content>) { return <AccordionPrimitive.Content data-slot="accordion-content" className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up px-4 text-sm overflow-hidden" {...props}><div className={cn("pt-0 pb-4 [&_a]:hover:text-foreground h-[--radix-accordion-content-height] [&_a]:underline [&_a]:underline-offset-4 [&_p:not(:last-child)]:mb-4", className)}>{children}</div></AccordionPrimitive.Content> }

// ============================================================================
// 13. CHECKBOX
// ============================================================================
function Checkbox({ className, ...props }: React.ComponentProps<typeof CheckboxPrimitive.Root>) { return <CheckboxPrimitive.Root data-slot="checkbox" className={cn("border-input dark:bg-input/30 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground dark:data-[state=checked]:bg-primary data-[state=checked]:border-primary aria-invalid:aria-checked:border-primary aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 flex size-4 items-center justify-center rounded-[6px] border transition-shadow group-has-disabled/field:opacity-50 focus-visible:ring-[3px] aria-invalid:ring-[3px] peer relative shrink-0 outline-none after:absolute after:-inset-x-3 after:-inset-y-2 disabled:cursor-not-allowed disabled:opacity-50", className)} {...props}><CheckboxPrimitive.Indicator data-slot="checkbox-indicator" className="[&>svg]:size-3.5 grid place-content-center text-current transition-none"><Check /></CheckboxPrimitive.Indicator></CheckboxPrimitive.Root> }

// ============================================================================
// 14. CARD
// ============================================================================
function Card({ className, size = "default", ...props }: React.ComponentProps<"div"> & { size?: "default" | "sm" }) { return <div data-slot="card" data-size={size} className={cn("ring-foreground/10 bg-card text-card-foreground gap-6 overflow-hidden rounded-2xl py-6 text-sm ring-1 has-[>img:first-child]:pt-0 data-[size=sm]:gap-4 data-[size=sm]:py-4 [&>img:first-child]:rounded-t-xl [&>img:last-child]:rounded-b-xl group/card flex flex-col", className)} {...props} /> }
function CardHeader({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="card-header" className={cn("gap-2 rounded-t-xl px-6 group-data-[size=sm]/card:px-4 [.border-b]:pb-6 group-data-[size=sm]/card:[.border-b]:pb-4 group/card-header @container/card-header grid auto-rows-min items-start has-[[data-slot=card-action]]:grid-cols-[1fr_auto] has-[[data-slot=card-description]]:grid-rows-[auto_auto]", className)} {...props} /> }
function CardTitle({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="card-title" className={cn("text-base font-medium", className)} {...props} /> }
function CardDescription({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="card-description" className={cn("text-muted-foreground text-sm", className)} {...props} /> }
function CardAction({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="card-action" className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)} {...props} /> }
function CardContent({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="card-content" className={cn("px-6 group-data-[size=sm]/card:px-4", className)} {...props} /> }
function CardFooter({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="card-footer" className={cn("rounded-b-xl px-6 group-data-[size=sm]/card:px-4 [.border-t]:pt-6 group-data-[size=sm]/card:[.border-t]:pt-4 flex items-center", className)} {...props} /> }

// ============================================================================
// 15. AVATAR
// ============================================================================
import { Avatar as AvatarPrimitive } from "@radix-ui/react-select"
function Avatar({ className, size = "default", ...props }: React.ComponentProps<typeof AvatarPrimitive.Root> & { size?: "default" | "sm" | "lg" }) { return <AvatarPrimitive.Root data-slot="avatar" data-size={size} className={cn("size-8 rounded-full after:rounded-full data-[size=lg]:size-10 data-[size=sm]:size-6 after:border-border group/avatar relative flex shrink-0 select-none after:absolute after:inset-0 after:border after:mix-blend-darken dark:after:mix-blend-lighten", className)} {...props} /> }
function AvatarImage({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Image>) { return <AvatarPrimitive.Image data-slot="avatar-image" className={cn("rounded-full aspect-square size-full object-cover", className)} {...props} /> }
function AvatarFallback({ className, ...props }: React.ComponentProps<typeof AvatarPrimitive.Fallback>) { return <AvatarPrimitive.Fallback data-slot="avatar-fallback" className={cn("bg-muted text-muted-foreground rounded-full flex size-full items-center justify-center text-sm group-data-[size=sm]/avatar:text-xs", className)} {...props} /> }
function AvatarBadge({ className, ...props }: React.ComponentProps<"span">) { return <span data-slot="avatar-badge" className={cn("bg-primary text-primary-foreground ring-background absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-blend-color ring-2 select-none group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2 group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2", className)} {...props} /> }
function AvatarGroup({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="avatar-group" className={cn("[&_[data-slot=avatar]]:ring-background group/avatar-group flex -space-x-2 [&_[data-slot=avatar]]:ring-2", className)} {...props} /> }
function AvatarGroupCount({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="avatar-group-count" className={cn("bg-muted text-muted-foreground size-8 rounded-full text-sm group-has-[[data-size=lg]]/avatar-group:size-10 group-has-[[data-size=sm]]/avatar-group:size-6 [&>svg]:size-4 group-has-[[data-size=lg]]/avatar-group:[&>svg]:size-5 group-has-[[data-size=sm]]/avatar-group:[&>svg]:size-3 ring-background relative flex shrink-0 items-center justify-center ring-2", className)} {...props} /> }

// ============================================================================
// 16. POPOVER
// ============================================================================
function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) { return <PopoverPrimitive.Root data-slot="popover" {...props} /> }
function PopoverTrigger({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) { return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} /> }
function PopoverContent({ className, align = "center", sideOffset = 4, ...props }: React.ComponentProps<typeof PopoverPrimitive.Content>) { return <PopoverPrimitive.Portal><PopoverPrimitive.Content data-slot="popover-content" align={align} sideOffset={sideOffset} className={cn("bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ring-foreground/5 flex flex-col gap-4 rounded-2xl p-4 text-sm shadow-2xl ring-1 duration-100 z-50 w-72 origin-[--radix-popover-content-transform-origin] outline-none", className)} {...props} /></PopoverPrimitive.Portal> }
function PopoverAnchor({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Anchor>) { return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} /> }
function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) { return <div data-slot="popover-header" className={cn("flex flex-col gap-1 text-sm", className)} {...props} /> }
function PopoverTitle({ className, ...props }: React.ComponentProps<"h2">) { return <div data-slot="popover-title" className={cn("text-base font-medium", className)} {...props} /> }
function PopoverDescription({ className, ...props }: React.ComponentProps<"p">) { return <p data-slot="popover-description" className={cn("text-muted-foreground", className)} {...props} /> }

// ============================================================================
// 17. COLLAPSIBLE
// ============================================================================
function Collapsible({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.Root>) { return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} /> }
function CollapsibleTrigger({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) { return <CollapsiblePrimitive.CollapsibleTrigger data-slot="collapsible-trigger" {...props} /> }
function CollapsibleContent({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) { return <CollapsiblePrimitive.CollapsibleContent data-slot="collapsible-content" {...props} /> }


// EXPORTAÇÕES GLOBAIS
export {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogMedia, AlertDialogOverlay, AlertDialogPortal, AlertDialogTitle, AlertDialogTrigger,
  Avatar, AvatarImage, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarBadge,
  Badge, badgeVariants,
  Button, buttonVariants,
  Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent,
  Checkbox,
  Collapsible, CollapsibleTrigger, CollapsibleContent,
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogOverlay, DialogPortal, DialogTitle, DialogTrigger,
  DropdownMenu, DropdownMenuPortal, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuLabel, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
  Field, FieldLabel, FieldDescription, FieldError, FieldGroup, FieldLegend, FieldSeparator, FieldSet, FieldContent, FieldTitle,
  Input,
  InputGroup, InputGroupAddon, InputGroupButton, InputGroupText, InputGroupInput, InputGroupTextarea,
  Label,
  Popover, PopoverAnchor, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger,
  Progress,
  RadioGroup, RadioGroupItem,
}
