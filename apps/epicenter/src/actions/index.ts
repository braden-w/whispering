// Mock Astro Actions for waitlist signup
// In production, this would use proper Astro Actions with database

export const server = {
  joinWaitlist: async (formData: FormData) => {
    const email = formData.get('email') as string;
    const interests = formData.getAll('interests') as string[];
    const otherInterest = formData.get('otherInterest') as string;
    
    // Mock implementation - just log for now
    console.log('Waitlist signup:', { email, interests, otherInterest });
    
    // In production, this would save to database
    // For now, just return success
    return {
      data: {
        success: true,
        message: 'Thanks for joining the waitlist!',
      }
    };
  },
};