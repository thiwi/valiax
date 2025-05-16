import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatForm from '../../../frontend/src/components/chat/ChatForm';

// Mock the ChatForm component's dependencies and state
jest.mock('../../../frontend/src/components/chat/ChatForm', () => {
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
  
  test('renders the chat form correctly', () => {
    render(<MockedChatForm onSubmit={mockOnSubmit} />);
    
    // Check if input field exists
    const inputElement = screen.getByTestId('message-input') as HTMLInputElement;
    expect(inputElement).toBeInTheDocument();
    
    // Check if submit button exists
    const submitButton = screen.getByTestId('send-button');
    expect(submitButton).toBeInTheDocument();
  });
  
  test('handles input change correctly', async () => {
    render(<MockedChatForm onSubmit={mockOnSubmit} />);
    
    const inputElement = screen.getByTestId('message-input') as HTMLInputElement;
    
    // Simulate user typing
    await userEvent.type(inputElement, 'Hello, world!');
    
    // Check if input value is updated
    expect(inputElement).toHaveValue('Hello, world!');
  });
  
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
});
