import { Heading, Section, Text } from '@react-email/components'
import { EmailLayout } from './src/email-layout'

interface OtpEmailProps {
    otp: string
}

export const OtpEmail = ({ otp }: OtpEmailProps) => {
    return (
        <EmailLayout preview="Your verification code">
            <Section className="my-6">
                <Heading className="text-center text-2xl font-semibold text-foreground">
                    Your Verification Code
                </Heading>
                <Text className="text-center text-foreground/80">
                    Here is your one-time password to complete your sign-in.
                </Text>
            </Section>
            <Section className="text-center">
                <Text className="rounded bg-gray-200/50 px-10 py-4 text-center text-2xl font-bold tracking-widest text-foreground">
                    {otp}
                </Text>
            </Section>
            <Section className="my-6">
                <Text className="text-center text-foreground/80">
                    This code will expire in 10 minutes. If you did not request this code, you can safely ignore
                    this email.
                </Text>
            </Section>
        </EmailLayout>
    )
}

export default OtpEmail 