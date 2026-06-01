import { Text } from "react-native";

import { Modal } from "./modal";

interface DetailSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function DetailSheetText({ children }: { children: string }) {
  return (
    <Text className="font-sans text-[15px] leading-6 text-foreground">{children}</Text>
  );
}

function DetailSheetRoot({ visible, onClose, title, subtitle, children }: DetailSheetProps) {
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      variant="bottom"
      compact={false}
      scrollable
    >
      {children}
    </Modal>
  );
}

export const DetailSheet = Object.assign(DetailSheetRoot, { Text: DetailSheetText });
