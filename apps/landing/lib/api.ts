// Contact form submission types
export type ContactFormData = {
  name: string;
  email: string;
  company?: string;
  website?: string;
  monthlyVisitors?: string;
  message: string;
  source?: string;
};

export type ContactResponse = {
  success: boolean;
  message: string;
  submissionsRemaining?: number;
  error?: string;
  details?: Record<string, any>;
};

/**
 * Submit a contact form
 * @param data Contact form data
 * @returns Response with success status and message
 */
export async function submitContactForm(data: ContactFormData): Promise<ContactResponse> {
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: result.error || 'Failed to submit contact form',
        error: result.error,
        details: result.details,
      };
    }

    return {
      success: true,
      message: result.message || 'Your message has been received. We\'ll get back to you shortly.',
      submissionsRemaining: result.submissionsRemaining,
    };
  } catch (error) {
    console.error('Error submitting contact form:', error);
    return {
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
} 