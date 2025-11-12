import * as React from "react"
import { Label } from "./label"

interface FormContextValue {
  errors: Record<string, string>
}

const FormContext = React.createContext<FormContextValue>({ errors: {} })

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  errors?: Record<string, string>
}

export function Form({ errors = {}, children, ...props }: FormProps) {
  return (
    <FormContext.Provider value={{ errors }}>
      <form {...props}>{children}</form>
    </FormContext.Provider>
  )
}

interface FormFieldContextValue {
  name: string
  id: string
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null)

interface FormFieldProps {
  name: string
  children: React.ReactNode
}

export function FormField({ name, children }: FormFieldProps) {
  const id = React.useId()
  return (
    <FormFieldContext.Provider value={{ name, id }}>
      <div className="space-y-2">{children}</div>
    </FormFieldContext.Provider>
  )
}

interface FormItemProps {
  children: React.ReactNode
  className?: string
}

export function FormItem({ children, className = "" }: FormItemProps) {
  return <div className={`space-y-2 ${className}`}>{children}</div>
}

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode
}

export function FormLabel({ children, ...props }: FormLabelProps) {
  const field = React.useContext(FormFieldContext)
  if (!field) throw new Error("FormLabel must be used within FormField")

  return (
    <Label htmlFor={field.id} {...props}>
      {children}
    </Label>
  )
}

interface FormControlProps {
  children: React.ReactElement
}

export function FormControl({ children }: FormControlProps) {
  const field = React.useContext(FormFieldContext)
  if (!field) throw new Error("FormControl must be used within FormField")

  return React.cloneElement(children, {
    id: field.id,
    name: field.name,
    ...children.props,
  })
}

interface FormDescriptionProps {
  children: React.ReactNode
  className?: string
}

export function FormDescription({ children, className = "" }: FormDescriptionProps) {
  return (
    <p className={`text-sm text-gray-600 ${className}`}>
      {children}
    </p>
  )
}

interface FormMessageProps {
  children?: React.ReactNode
  className?: string
}

export function FormMessage({ children, className = "" }: FormMessageProps) {
  const field = React.useContext(FormFieldContext)
  const form = React.useContext(FormContext)

  const error = field ? form.errors[field.name] : undefined
  const message = error || children

  if (!message) return null

  return (
    <p className={`text-sm font-medium text-red-600 ${className}`}>
      {message}
    </p>
  )
}
