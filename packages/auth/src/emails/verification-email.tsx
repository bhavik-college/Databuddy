import { Button, Heading, Section, Text } from '@react-email/components'
import { EmailLayout } from './email-layout'

interface VerificationEmailProps {
    url: string
}

export const VerificationEmail = ({ url }: VerificationEmailProps) => {
    return (
        <EmailLayout preview="Verify your email address">
            <Section className="my-6">
                <Heading className="text-center text-2xl font-semibold text-foreground">
                    Verify Your Email Address
                </Heading>
                <Text className="text-center text-foreground/80">
                    Thanks for signing up for Databuddy! Please click the button below to verify your email address.
                </Text>
            </Section>
            <Section className="text-center">
                <Button
                    className="rounded bg-brand px-5 py-3 text-center text-sm font-medium text-white"
                    href={url}
                >
                    Verify Email
                </Button>
            </Section>
            <Section className="my-6">
                <Text className="text-center text-foreground/80">
                    This link will expire in 24 hours. If you did not sign up for a Databuddy account, you can
                    safely ignore this email.
                </Text>
                <Text className="mt-4 text-center text-foreground/60">
                    If you're having trouble with the button above, copy and paste the URL below into your web
                    browser.
                </Text>
                <Text className="mt-2 max-w-full overflow-x-auto text-center text-sm text-foreground/60">
                    {url}
                </Text>
            </Section>
        </EmailLayout>
    )
}

export default VerificationEmail 