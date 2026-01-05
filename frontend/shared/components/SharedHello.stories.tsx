import type { Meta, StoryObj } from "@storybook/react";
import { SharedHello } from "./SharedHello";

const meta: Meta<typeof SharedHello> = {
  title: "Shared/SharedHello",
  component: SharedHello,
};
export default meta;

type Story = StoryObj<typeof SharedHello>;

export const Default: Story = {
  args: {},
};
