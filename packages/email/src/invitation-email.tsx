import { Button, Heading, Section, Text } from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './email-layout'

interface InvitationEmailProps {
    inviterName: string
    organizationName: string
    invitationLink: string
}

export const InvitationEmail = ({
    inviterName,
    organizationName,
    invitationLink,
}: InvitationEmailProps) => {
    return (
        <EmailLayout preview={`You've been invited to ${organizationName}`}>
            <Section className="my-6">
                <Heading className="text-center text-2xl font-semibold text-foreground">
                    You're invited to join {organizationName}
                </Heading>
                <Text className="text-center text-foreground/80">
                    <strong>{inviterName}</strong> has invited you to collaborate on Databuddy.
                </Text>
            </Section>
            <Section className="text-center">
                <Button
                    className="rounded bg-brand px-5 py-3 text-center text-sm font-medium text-white"
                    href={invitationLink}
                >
                    Accept Invitation
                </Button>
            </Section>
            <Section className="my-6">
                <Text className="text-center text-foreground/80">
                    This invitation will expire in 48 hours.
                </Text>
                <Text className="mt-4 text-center text-foreground/60">
                    If you're having trouble with the button above, copy and paste the URL below into your web
                    browser.
                </Text>
                <Text className="mt-2 max-w-full overflow-x-auto text-center text-sm text-foreground/60">
                    {invitationLink}
                </Text>
            </Section>
        </EmailLayout>
    )
}

export default InvitationEmail 