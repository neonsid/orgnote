import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { useReducer } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

import { Button, Input, Modal } from "@/components/ui";
import { showThemedAlert } from "@/contexts/themed-alert";
import { useAppTheme } from "@/contexts/app-theme";
import { GROUP_COLORS } from "@/lib/group-colors";
import { api } from "../../../../convex/_generated/api";

type CreateVaultGroupState = {
  title: string;
  selectedColor: string;
  loading: boolean;
};

type CreateVaultGroupAction =
  | { type: "reset" }
  | { type: "setTitle"; title: string }
  | { type: "setColor"; color: string }
  | { type: "setLoading"; loading: boolean };

const initialCreateVaultGroupState = (): CreateVaultGroupState => ({
  title: "",
  selectedColor: GROUP_COLORS[0].value,
  loading: false,
});

function createVaultGroupReducer(
  state: CreateVaultGroupState,
  action: CreateVaultGroupAction
): CreateVaultGroupState {
  switch (action.type) {
    case "reset":
      return initialCreateVaultGroupState();
    case "setTitle":
      return { ...state, title: action.title };
    case "setColor":
      return { ...state, selectedColor: action.color };
    case "setLoading":
      return { ...state, loading: action.loading };
    default:
      return state;
  }
}

export function CreateVaultGroupModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { colors } = useAppTheme();
  const [state, dispatch] = useReducer(createVaultGroupReducer, undefined, initialCreateVaultGroupState);
  const { title, selectedColor, loading } = state;
  const createGroup = useMutation(api.vault.mutations.createVaultGroup);

  async function handleCreate() {
    if (!title.trim()) return;

    dispatch({ type: "setLoading", loading: true });
    try {
      await createGroup({ title: title.trim(), color: selectedColor });
      dispatch({ type: "reset" });
      onClose();
    } catch (err) {
      showThemedAlert("Error", err instanceof Error ? err.message : "Failed to create collection");
    } finally {
      dispatch({ type: "setLoading", loading: false });
    }
  }

  function handleClose() {
    dispatch({ type: "reset" });
    onClose();
  }

  return (
    <Modal visible={visible} onClose={handleClose} title="Create collection" variant="bottom">
      <View className="gap-3 p-4">
        <Input
          placeholder="Collection name..."
          value={title}
          onChangeText={(t) => dispatch({ type: "setTitle", title: t })}
        />
        <Text className="text-[13px] font-semibold text-secondary-foreground">Color</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="mb-2 flex-row flex-wrap gap-2"
        >
          {GROUP_COLORS.map((c) => {
            const selected = selectedColor === c.value;
            return (
              <Pressable
                key={c.value}
                onPress={() => dispatch({ type: "setColor", color: c.value })}
                className="h-9 w-9 items-center justify-center rounded-full border-[3px]"
                style={{
                  backgroundColor: c.value,
                  borderColor: selected ? colors.text : "transparent",
                }}
                accessibilityLabel={c.label}
              >
                {selected ? <Ionicons name="checkmark" size={18} color="#ffffff" /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
        <Button onPress={handleCreate} disabled={!title.trim()} loading={loading}>
          <Button.Text>Create</Button.Text>
        </Button>
      </View>
    </Modal>
  );
}
