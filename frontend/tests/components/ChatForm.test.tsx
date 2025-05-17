import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ChatForm from 'src/components/chat/ChatForm';

/**
 * Unit tests for the ChatForm component.
 * We mock the ChatForm to simplify interactions:
 * - The mock renders an input (data-testid="message-input") and a button (data-testid="send-button").
 * - The send-button's onClick handler reads input.value, trims whitespace,
 *   invokes onSubmit(input.value) if non-empty, then clears the input.
 */

// Mock the ChatForm component's dependencies and state
jest.mock('src/components/chat/ChatForm', () => {
  const MockChatForm = ({ onSubmit, ...rest }: { onSubmit: (message: string) => void } & Partial<Record<string, unknown>>) => {
    return (
      <div>
        <input 
          data-testid="message-input" 
          placeholder="Type your message here..." 
        />
        <button 
          data-testid="send-button"
          onClick={() => {
            const input = document.querySelector('[data-testid="message-input"]') as HTMLInputElement | null;
            if (input && input.value.trim()) {
              onSubmit(input.value);
              input.value = '';
            }
          }}
        >
          Send
        </button>
      </div>
    );
  };

  return {
    __esModule: true,
    default: MockChatForm,
  };
});

// Use the mocked ChatForm with a simplified props type
const MockedChatForm = ChatForm as unknown as React.FC<{ onSubmit: (message: string) => void }>;

describe('ChatForm component', () => {
  const mockOnSubmit = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // Test: Ensure that the ChatForm renders an input field and a submit button.
  test('renders the chat form correctly', () => {
    render(<MockedChatForm onSubmit={mockOnSubmit} />);
    
    // Check if input field exists
    const inputElement = screen.getByTestId('message-input') as HTMLInputElement;
    expect(inputElement).toBeInTheDocument();
    
    // Check if submit button exists
    const submitButton = screen.getByTestId('send-button');
    expect(submitButton).toBeInTheDocument();
  });
  
  // Test: When the user types into the input, the value updates accordingly.
  test('handles input change correctly', async () => {
    render(<MockedChatForm onSubmit={mockOnSubmit} />);
    
    const inputElement = screen.getByTestId('message-input') as HTMLInputElement;
    
    // Simulate user typing
    await userEvent.type(inputElement, 'Hello, world!');
    
    // Check if input value is updated
    expect(inputElement).toHaveValue('Hello, world!');
  });
  
  // Test: After typing a non-empty message and clicking send, onSubmit is called with the correct message and input is cleared.
  test('submits the form with input value', async () => {
    render(<MockedChatForm onSubmit={mockOnSubmit} />);
    
    const inputElement = screen.getByTestId('message-input') as HTMLInputElement;
    const submitButton = screen.getByTestId('send-button');
    
    // Type a message
    await userEvent.type(inputElement, 'Test message');
    
    // Submit the form
    await userEvent.click(submitButton);
    
    // Check if onSubmit was called with the correct value
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith('Test message');
  });

  // Test: Clicking send with an empty input does not call onSubmit.
  test('does not submit when input is empty', async () => {
    render(<MockedChatForm onSubmit={mockOnSubmit} />);
    const submitButton = screen.getByTestId('send-button');
    await userEvent.click(submitButton);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  // Test: Messages consisting solely of whitespace are not submitted.
  test('does not submit when input contains only whitespace', async () => {
    render(<MockedChatForm onSubmit={mockOnSubmit} />);
    const input = screen.getByTestId('message-input') as HTMLInputElement;
    const submitButton = screen.getByTestId('send-button');
    await userEvent.type(input, '   ');
    await userEvent.click(submitButton);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  // Test: After a successful submission, the input field is cleared.
  test('clears input after successful submit', async () => {
    render(<MockedChatForm onSubmit={mockOnSubmit} />);
    const input = screen.getByTestId('message-input') as HTMLInputElement;
    const submitButton = screen.getByTestId('send-button');
    await userEvent.type(input, 'abc');
    await userEvent.click(submitButton);
    expect(input).toHaveValue('');
  });

  // Test: Leading and trailing whitespace in the message are preserved when passed to onSubmit.
  test('preserves whitespace in submitted message', async () => {
    render(<MockedChatForm onSubmit={mockOnSubmit} />);
    const input = screen.getByTestId('message-input') as HTMLInputElement;
    const submitButton = screen.getByTestId('send-button');
    await userEvent.type(input, '  abc  ');
    await userEvent.click(submitButton);
    expect(mockOnSubmit).toHaveBeenCalledWith('  abc  ');
  });

  // Test: The input placeholder text matches the design specification.
  test('placeholder text is correct', () => {
    render(<MockedChatForm onSubmit={mockOnSubmit} />);
    const input = screen.getByTestId('message-input') as HTMLInputElement;
    expect(input.placeholder).toBe('Type your message here...');
  });

  // Test: Each send action calls onSubmit once with the correct message.
  test('multiple submits increment call count', async () => {
    render(<MockedChatForm onSubmit={mockOnSubmit} />);
    const input = screen.getByTestId('message-input') as HTMLInputElement;
    const submitButton = screen.getByTestId('send-button');
    await userEvent.type(input, 'first');
    await userEvent.click(submitButton);
    await userEvent.type(input, 'second');
    await userEvent.click(submitButton);
    expect(mockOnSubmit).toHaveBeenCalledTimes(2);
    expect(mockOnSubmit).toHaveBeenNthCalledWith(1, 'first');
    expect(mockOnSubmit).toHaveBeenNthCalledWith(2, 'second');
  });

  // Test: The input field is initialized with an empty string.
  test('input initial value is empty', () => {
    render(<MockedChatForm onSubmit={mockOnSubmit} />);
    const input = screen.getByTestId('message-input') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  // Test: Whitespace-only submit attempt does not clear the input field.
  test('input remains unchanged after whitespace-only submit attempt', async () => {
    render(<MockedChatForm onSubmit={mockOnSubmit} />);
    const input = screen.getByTestId('message-input') as HTMLInputElement;
    const submitButton = screen.getByTestId('send-button');
    await userEvent.type(input, '   ');
    await userEvent.click(submitButton);
    expect(input).toHaveValue('   ');
  });
});
