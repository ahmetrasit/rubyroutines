import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SharedPersonCard } from '@/components/person/SharedPersonCard'

describe('SharedPersonCard', () => {
  const defaultProps = {
    person: {
      id: 'person1',
      name: 'Test Child',
      age: 8,
      emoji: '👤',
      color: '#3B82F6',
    },
    permissionLevel: 'VIEW' as const,
    sharedBy: 'Parent Name',
    onClick: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render person information', () => {
    render(<SharedPersonCard {...defaultProps} />)

    expect(screen.getByText('Test Child')).toBeInTheDocument()
    expect(screen.getByText('👤')).toBeInTheDocument()
    expect(screen.getByText('Age: 8')).toBeInTheDocument()
  })

  it('should display shared by information', () => {
    render(<SharedPersonCard {...defaultProps} />)

    expect(screen.getByText(/shared by: parent name/i)).toBeInTheDocument()
  })

  it('should display VIEW permission badge', () => {
    render(<SharedPersonCard {...defaultProps} />)

    const badge = screen.getByText('VIEW')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-blue-100', 'text-blue-800')
  })

  it('should display EDIT permission badge with correct styling', () => {
    render(<SharedPersonCard {...defaultProps} permissionLevel="EDIT" />)

    const badge = screen.getByText('EDIT')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-800')
  })

  it('should display MANAGE permission badge with correct styling', () => {
    render(<SharedPersonCard {...defaultProps} permissionLevel="MANAGE" />)

    const badge = screen.getByText('MANAGE')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-green-100', 'text-green-800')
  })

  it('should apply the correct background color', () => {
    const { container } = render(<SharedPersonCard {...defaultProps} />)

    const card = container.firstChild
    expect(card).toHaveStyle('backgroundColor: #3B82F6')
  })

  it('should call onClick when card is clicked', async () => {
    const user = userEvent.setup()
    render(<SharedPersonCard {...defaultProps} />)

    const card = screen.getByRole('button')
    await user.click(card)

    expect(defaultProps.onClick).toHaveBeenCalledWith(defaultProps.person)
  })

  it('should display hover effect', async () => {
    const user = userEvent.setup()
    const { container } = render(<SharedPersonCard {...defaultProps} />)

    const card = container.firstChild as HTMLElement
    await user.hover(card)

    expect(card).toHaveClass('hover:scale-105')
  })

  it('should be keyboard accessible', async () => {
    const user = userEvent.setup()
    render(<SharedPersonCard {...defaultProps} />)

    const card = screen.getByRole('button')

    // Tab to focus the card
    await user.tab()
    expect(card).toHaveFocus()

    // Press Enter to activate
    await user.keyboard('{Enter}')
    expect(defaultProps.onClick).toHaveBeenCalled()
  })

  it('should handle long person names gracefully', () => {
    const longNameProps = {
      ...defaultProps,
      person: {
        ...defaultProps.person,
        name: 'Very Long Person Name That Might Overflow',
      },
    }

    render(<SharedPersonCard {...longNameProps} />)

    const nameElement = screen.getByText('Very Long Person Name That Might Overflow')
    expect(nameElement).toHaveClass('truncate')
  })

  it('should handle missing emoji gracefully', () => {
    const noEmojiProps = {
      ...defaultProps,
      person: {
        ...defaultProps.person,
        emoji: undefined,
      },
    }

    render(<SharedPersonCard {...noEmojiProps} />)

    // Should display a default icon or placeholder
    expect(screen.getByText('👤')).toBeInTheDocument()
  })

  it('should display age appropriately', () => {
    const youngChildProps = {
      ...defaultProps,
      person: {
        ...defaultProps.person,
        age: 3,
      },
    }

    render(<SharedPersonCard {...youngChildProps} />)
    expect(screen.getByText('Age: 3')).toBeInTheDocument()
  })

  it('should handle null age', () => {
    const noAgeProps = {
      ...defaultProps,
      person: {
        ...defaultProps.person,
        age: null,
      },
    }

    render(<SharedPersonCard {...noAgeProps} />)
    expect(screen.queryByText(/age:/i)).not.toBeInTheDocument()
  })

  it('should display multiple permission indicators when needed', () => {
    render(<SharedPersonCard {...defaultProps} permissionLevel="MANAGE" />)

    // Check for visual indicators of capabilities
    expect(screen.getByText('MANAGE')).toBeInTheDocument()
    expect(screen.getByTitle(/can view, edit, and manage/i)).toBeInTheDocument()
  })
})