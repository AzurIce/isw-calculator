import { Accessor, Component, createSignal, For, Match, Show, Switch } from "solid-js";
import { EmergencyOperation, EmergencyOperationInfos, HiddenOperation, HiddenOperationInfos, Level } from "../data/sarkaz";
import { Box, Button, ButtonGroup, Modal, Paper, Typography } from "@suid/material";

// 刷新 *30% / 死仇刷新 *10%
// 无漏 *120%
export type EmergencyOperationRecord = {
  operation: EmergencyOperation,
  refresh: boolean,
  perfect: boolean,
}

// 非无漏 *50%
export type HiddenOperationRecord = {
  operation: HiddenOperation,
  emergency: boolean,
  perfect: boolean,
}

export const AddOperationRecordModal: Component<{
  open: Accessor<boolean>,
  onClose: () => void,
  onAddEmergencyRecord: (operation: EmergencyOperationRecord) => void
  onAddHiddenRecord: (operation: HiddenOperationRecord) => void
}> = ({ open, onClose, onAddEmergencyRecord, onAddHiddenRecord }) => {

  const [tab, setTab] = createSignal(0);

  return <>
    <Modal open={open()} onClose={() => {
      onClose();
    }}>
      <Paper sx={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
        width: "50%", maxHeight: "80%",
        padding: 2,
        display: "flex", flexDirection: "column"
      }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Typography variant="h6" sx={{ marginBottom: 1 }}>添加紧急或隐藏作战</Typography>
          <ButtonGroup sx={{ paddingBottom: 1 }}>
            <Button
              variant={tab() == 0 ? 'contained' : 'outlined'}
              onClick={() => { setTab(0) }}
              size="small"
            >
              紧急作战
            </Button>
            <Button
              variant={tab() == 1 ? 'contained' : 'outlined'}
              onClick={() => { setTab(1) }}
              size="small"
            >
              隐藏作战
            </Button>
          </ButtonGroup>
        </Box>
        <Switch>
          <Match when={tab() == 0}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
              <For each={[Level.Third, Level.Fourth, Level.Fifth, Level.Sixth]}>{(level) => <>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <span>{level}</span>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    <For each={Object.values(EmergencyOperation).filter((operation) => EmergencyOperationInfos[operation].level == level)}>{(operation) => <>
                      <Button variant="outlined" onClick={() => {
                        onAddEmergencyRecord({
                          operation,
                          refresh: false,
                          perfect: false,
                        } as EmergencyOperationRecord);
                        onClose();
                      }}>{operation}</Button>
                    </>}</For>
                  </Box>
                </Box>
              </>}</For>
            </Box>
          </Match>
          <Match when={tab() == 1}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
              <For each={Object.values(HiddenOperation)}>{(operation) => <>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  <Show when={HiddenOperationInfos[operation].score !== 0}>
                    <Button variant="outlined" onClick={() => {
                      onAddHiddenRecord({
                        operation,
                        emergency: false,
                        perfect: false,
                      } as HiddenOperationRecord);
                      onClose();
                    }}>{operation}</Button>
                  </Show>
                  <Show when={HiddenOperationInfos[operation].emergency_score !== 0}>
                    <Button variant="outlined" color="error" onClick={() => {
                      onAddHiddenRecord({
                        operation,
                        emergency: true,
                        perfect: false,
                      } as HiddenOperationRecord);
                      onClose();
                    }}>{operation}（紧急）</Button>
                  </Show>
                </Box>
              </>}</For>
            </Box>
          </Match>
        </Switch>
        <Box sx={{ display: "flex", gap: 2, justifyContent: "end" }}>
          {/* <Button variant="contained" onClick={() => {
            onAdd(EmergencyOperation.AGreatGame);
          }}>添加</Button> */}
          <Button variant="outlined" onClick={onClose}>取消</Button>
        </Box>
      </Paper>
    </Modal>
  </>
}