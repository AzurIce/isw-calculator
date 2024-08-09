import { createSignal, For, Show } from "solid-js";
import "./App.css";
import { Box, Button, Card, Checkbox, Divider, FormControl, InputLabel, MenuItem, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@suid/material";

import { BannedOperator as BannedOperator, BannedOperatorInfos, BossOperation, BossOperationInfos, Collectible, EmergencyOperation, EmergencyOperationInfos, HiddenOperation, HiddenOperationInfos, KingsCollectible, Squad } from "./data/sarkaz";
import { AddOperationRecordModal, EmergencyOperationRecord, HiddenOperationRecord } from "./components/AddOperationRecordModal";
import { createStore } from "solid-js/store";
import { AddBossRecordModal, BossOperationRecord } from "./components/AddBossRecordModal";
import { invoke } from "@tauri-apps/api/core";

type BannedOperatorRecord = {
  operator: BannedOperator,
  banned: boolean,
}

type KingsCollectibleRecord = {
  collectible: KingsCollectible,
  owned: boolean,
}

type Store = {
  collectible: Collectible | null,
  squad: Squad | null,
  emergencyRecords: EmergencyOperationRecord[],
  hiddenRecords: HiddenOperationRecord[],
  bossRecords: BossOperationRecord[],
  collectionsCnt: number,
  killedHiddenCnt: number,
  refreshCnt: number,
  withdrawCnt: number,
  score: number,
  bannedOperatorRecords: BannedOperatorRecord[],
  kingsCollectibleRecords: KingsCollectibleRecord[],

}

const testStoreValue: Store = {
  squad: Squad.BlueprintSurveyingSquad,
  collectible: Collectible.DoodleInTheEraOfHope,
  collectionsCnt: 0,
  killedHiddenCnt: 0,
  refreshCnt: 0,
  withdrawCnt: 0,
  score: 0,
  bannedOperatorRecords: Object.values(BannedOperator).map((operator) => ({
    operator: operator as BannedOperator,
    banned: true
  })),
  kingsCollectibleRecords: Object.values(KingsCollectible).map((collectible) => ({
    collectible: collectible as KingsCollectible,
    owned: false
  })),
  emergencyRecords: [
    {
      operation: EmergencyOperation.AGreatGame,
      refresh: false,
      perfect: false,
    },
    {
      operation: EmergencyOperation.AGreatGame,
      refresh: false,
      perfect: false,
    },
    {
      operation: EmergencyOperation.AGreatGame,
      refresh: false,
      perfect: false,
    },
    {
      operation: EmergencyOperation.AGreatGame,
      refresh: false,
      perfect: false,
    },
    {
      operation: EmergencyOperation.AGreatGame,
      refresh: false,
      perfect: true,
    }
  ],
  hiddenRecords: [
    {
      operation: HiddenOperation.DuckHighway,
      emergency: true,
      perfect: true
    }
  ],
  bossRecords: [
    {
      operation: BossOperation.Audience,
      chaos: false,
    }, {
      operation: BossOperation.CivitasSancta,
      chaos: true,
    }
  ]
};

const defaultStoreValue: Store = {
  squad: null,
  collectible: null,
  collectionsCnt: 0,
  killedHiddenCnt: 0,
  refreshCnt: 0,
  withdrawCnt: 0,
  score: 0,
  bannedOperatorRecords: Object.values(BannedOperator).map((operator) => ({
    operator: operator as BannedOperator,
    banned: true
  })),
  kingsCollectibleRecords: Object.values(KingsCollectible).map((collectible) => ({
    collectible: collectible as KingsCollectible,
    owned: false
  })),
  emergencyRecords: [],
  hiddenRecords: [],
  bossRecords: []
};

function App() {
  const [addOperationRecordModalOpen, setAddOperationRecordModalOpen] = createSignal(false);
  const [addBossRecordModalOpen, setAddBossRecordModalOpen] = createSignal(false);

  const [store, setStore] = createStore<Store>({ ...defaultStoreValue });

  const addEmergencyRecord = (record: EmergencyOperationRecord) => {
    setStore('emergencyRecords', (operations) => [...operations, record])
  }

  const updateEmergencyRecord = (idx: number, record: EmergencyOperationRecord) => {
    setStore('emergencyRecords', (operations) => operations.map((operation, i) =>
      i !== idx ? operation : record
    ))
  }

  const removeEmergencyRecord = (idx: number) => {
    setStore('emergencyRecords', (operations) => operations.filter((_, i) =>
      i !== idx
    ))
  }

  const calcEmergencyRecordScore = (idx: number) => {
    const record = store.emergencyRecords[idx];
    const info = EmergencyOperationInfos[record.operation];
    const score = info.score * (record.perfect ? 1.2 : 1) * (
      record.refresh ? (
        store.collectible == Collectible.HatredInTheEraOfDeathFeud ? 0.1 : 0.3
      ) : 1
    );
    return score;
  }

  const addHiddenRecord = (record: HiddenOperationRecord) => {
    setStore('hiddenRecords', (operations) => [...operations, record])
  }

  const updateHiddenRecord = (idx: number, record: HiddenOperationRecord) => {
    setStore('hiddenRecords', (operations) => operations.map((operation, i) =>
      i !== idx ? operation : record
    ))
  }

  const removeHiddenRecord = (idx: number) => {
    setStore('hiddenRecords', (operations) => operations.filter((_, i) =>
      i !== idx
    ))
  }

  const calcHiddenRecordScore = (idx: number) => {
    const record = store.hiddenRecords[idx];
    const info = HiddenOperationInfos[record.operation];
    const score = (record.emergency ? info.emergency_score : info.score) * (record.perfect ? 1 : 0.5);
    return score;
  }

  const addBossRecord = (record: BossOperationRecord) => {
    setStore('bossRecords', (operations) => [...operations, record])
  }

  const removeBossRecord = (idx: number) => {
    setStore('bossRecords', (operations) => operations.filter((_, i) =>
      i !== idx
    ))
  }

  const calcBossRecordScore = (idx: number) => {
    const record = store.bossRecords[idx];
    const info = BossOperationInfos[record.operation];
    const score = record.chaos ? info.chaos_score : info.score;
    return score;
  }

  const calcEmergencyAndHiddenSum = () => {
    const emergencySum = store.emergencyRecords.reduce((sum, _, idx) => sum + calcEmergencyRecordScore(idx), 0);
    const hiddenSum = store.hiddenRecords.reduce((sum, _, idx) => sum + calcHiddenRecordScore(idx), 0);
    return emergencySum + hiddenSum;
  }

  const calcBossSum = () => {
    const sum = store.bossRecords.reduce((sum, _, idx) => sum + calcBossRecordScore(idx), 0);
    return sum;
  }

  const toggleBannedOperator = (operator: BannedOperator) => {
    setStore("bannedOperatorRecords", (operators) => operators.map((item) => {
      return item.operator != operator ? item : { ...item, banned: !item.banned }
    }));
  }

  const calcBannedSum = () => {
    return store.bannedOperatorRecords.reduce((sum, record) => sum + (record.banned ? BannedOperatorInfos[record.operator] : 0), 0);
  }

  const toggleKingsCollectible = (collectible: KingsCollectible) => {
    setStore("kingsCollectibleRecords", (collectibles) => collectibles.map((item) => {
      return item.collectible != collectible ? item : { ...item, owned: !item.owned }
    }));
  }

  // 3) e) 结算时，若持有超过1件“国王”藏品，从第二件藏品开始每持有一件藏品扣除20分；触
  //       发“诸王的冠冕”3层效果时，额外扣除40分；若集齐游戏内所有“国王”藏品，额外扣除
  //       20分；
  const calcKingsCollectibleSum = () => {
    const kingsCollectibleCnt = store.kingsCollectibleRecords.reduce((sum, record) => sum + (record.owned ? 1 : 0), 0);
    const ownedCrown = store.kingsCollectibleRecords.find((record) => record.collectible == KingsCollectible.KingsCrown && record.owned);
    let score = 0;
    if (kingsCollectibleCnt > 1) {
      score = (kingsCollectibleCnt - 1) * -20;
    }
    if (kingsCollectibleCnt >= 3 && ownedCrown) {
      score -= 40;
    }
    if (kingsCollectibleCnt == 4) {
      score -= 20;
    }
    return score
  }

  /// Others ///

  // 3) f) 结算时，若持有“希望时代的涂鸦”，则每个藏品额外获得3分加分；
  const collectibleScore = () => store.collectible == Collectible.DoodleInTheEraOfHope ? 3 : 0;
  const calcCollectionsScore = () => {
    return store.collectionsCnt * collectibleScore();
  }

  // 3) a) 作战中，每击杀一个隐藏敌人（包括“鸭爵”、“高普尼克”、“流泪小子”与“圆仔”），额外获
  //       得10分加分；
  const calcHiddenScore = () => {
    return store.killedHiddenCnt * 10;
  }

  // 3) b) 每局游戏有8次刷新节点的机会，若选择蓝图测绘分队，则提升至15次。结算分数时，
  //        若本局游戏中刷新节点次数超过规定，每超出的一次刷新节点行为额外扣除50分。特
  //        殊地，持有“先知长角”且生效时，将节点刷新为“命运所指”的行为不计入刷新次数；
  const maxRefreshCnt = () => store.squad == Squad.BlueprintSurveyingSquad ? 15 : 8;
  const calcRefreshScore = () => {
    return store.refreshCnt > maxRefreshCnt() ? (store.refreshCnt - maxRefreshCnt()) * -50 : 0;
  }

  // 3) c) 每局游戏的源石锭余额减少总数超过40时，每额外减少1源石锭余额，额外扣除50分；
  const calcWithdrawScore = () => {
    return store.withdrawCnt > 40 ? (40 - store.withdrawCnt) * -50 : 0;
  }

  const calcScore = () => {
    return store.score * 0.5
  }

  const calcTotalSum = () => {
    return calcScore()
      + calcEmergencyAndHiddenSum() + calcBossSum()
      + calcCollectionsScore() + calcHiddenScore() + calcRefreshScore() + calcWithdrawScore()
      + calcBannedSum() + calcKingsCollectibleSum();
  }

  return <>
    <Box sx={{ display: "flex", gap: 2, height: "100%", boxSizing: "border-box", padding: 1 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, flex: 1, height: "100%", overflowY: "scroll", minWidth: 1000 }}>
        {/* 开局设置 */}
        <Card sx={{ display: "flex", flexShrink: 0, flexDirection: "column", gap: 1, padding: 2 }}>
          <Typography variant="h6">开局设置</Typography>
          <Box sx={{ display: "flex", gap: 2 }}>
            <FormControl sx={{ flex: 1 }}>
              <InputLabel id="squad-select-label">开局分队</InputLabel>
              <Select
                labelId="squad-select-label"
                id="squad-select"
                value={store.squad || ''} // use `|| ''` to prevent error
                label="开局分队"
                onChange={(e) => {
                  setStore("squad", e.target.value);
                }}
              >
                <For each={Object.values(Squad)}>{(squad) => <>
                  <MenuItem value={squad}>{squad}</MenuItem>
                </>}</For>
              </Select>
            </FormControl>

            <FormControl sx={{ flex: 1 }}>
              <InputLabel id="demo-simple-select-label">开局藏品</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={store.collectible || ''}
                label="开局藏品"
                onChange={(e) => {
                  setStore("collectible", e.target.value);
                }}
              >
                <For each={Object.values(Collectible)}>{(squad) => <>
                  <MenuItem value={squad}>{squad}</MenuItem>
                </>}</For>
              </Select>
            </FormControl>
          </Box >
        </Card>

        {/* 紧急和隐藏作战 */}
        <AddOperationRecordModal open={addOperationRecordModalOpen} onClose={() => {
          setAddOperationRecordModalOpen(false);
        }} onAddEmergencyRecord={addEmergencyRecord} onAddHiddenRecord={addHiddenRecord} />
        <Card sx={{ display: "flex", flexShrink: 0, flexDirection: "column", gap: 1, padding: 2 }}>
          <Box sx={{ display: "flex", alignContent: "center", gap: 2 }}>
            <Typography variant="h6">紧急和隐藏作战</Typography>
            <Button variant="contained" size="small" onClick={() => {
              setAddOperationRecordModalOpen(true)
            }}>
              添加
            </Button>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "stretch", gap: 1 }}>
            {/* 紧急作战 */}
            <TableContainer component={Box} sx={{ flex: 1, minWidth: 500 }}>
              <Table aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell>紧急作战名称</TableCell>
                    <TableCell>无漏</TableCell>
                    <TableCell>刷新</TableCell>
                    <TableCell align="right">分数</TableCell>
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <For each={store.emergencyRecords}>
                    {(item, idx) => (
                      <TableRow
                        sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                      >
                        <TableCell component="th" scope="row">
                          {item.operation}
                        </TableCell>
                        <TableCell>
                          <Checkbox checked={item.perfect} onChange={(e, v) => {
                            updateEmergencyRecord(idx(), { ...item, perfect: v });
                            console.log(item)
                          }} />
                        </TableCell>
                        <TableCell>
                          <Checkbox checked={item.refresh} onChange={(e, v) => {
                            updateEmergencyRecord(idx(), { ...item, refresh: v });
                          }} />
                        </TableCell>
                        <TableCell align="right">{calcEmergencyRecordScore(idx())}</TableCell>
                        <TableCell align="center">
                          <Button variant="contained" color="error" onClick={() => removeEmergencyRecord(idx())}>删除</Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </For>
                </TableBody>
              </Table>
            </TableContainer>

            <Divider orientation="vertical" flexItem />

            {/* 隐藏作战 */}
            <TableContainer component={Box} sx={{ flex: 1, minWidth: 400 }}>
              <Table aria-label="simple table">
                <TableHead>
                  <TableRow>
                    <TableCell>隐藏作战名称</TableCell>
                    <TableCell>无漏</TableCell>
                    <TableCell align="right">分数</TableCell>
                    <TableCell align="center">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <For each={store.hiddenRecords}>
                    {(item, idx) => (
                      <TableRow
                        sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                      >
                        <TableCell component="th" scope="row" sx={{ color: item.emergency ? 'red' : 'auto' }}>
                          {item.operation}
                          <Show when={item.emergency}>
                            （紧急）
                          </Show>
                        </TableCell>
                        <TableCell>
                          <Checkbox checked={item.perfect} onChange={(_, v) => {
                            updateHiddenRecord(idx(), { ...item, perfect: v });
                          }} />
                        </TableCell>
                        <TableCell align="right">{calcHiddenRecordScore(idx())}</TableCell>
                        <TableCell align="center">
                          <Button variant="contained" color="error" onClick={() => removeHiddenRecord(idx())}>删除</Button>
                        </TableCell>
                      </TableRow>
                    )}
                  </For>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          <Typography>该部分得分: {calcEmergencyAndHiddenSum()}</Typography>
        </Card >

        {/* 领袖作战 */}
        <AddBossRecordModal
          open={addBossRecordModalOpen}
          onClose={() => {
            setAddBossRecordModalOpen(false);
          }}
          onAddRecord={addBossRecord} />
        <Card sx={{ display: "flex", flexShrink: 0, flexDirection: "column", gap: 1, padding: 2 }}>
          <Box sx={{ display: "flex", alignContent: "center", gap: 2 }}>
            <Typography variant="h6">领袖作战</Typography>
            <Button variant="contained" size="small" onClick={() => {
              setAddBossRecordModalOpen(true)
            }}>
              添加
            </Button>
          </Box>

          {/* 领袖作战 */}
          <TableContainer component={Box} sx={{ flex: 1, minWidth: 600, }}>
            <Table aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell>领袖作战名称</TableCell>
                  <TableCell align="right">分数</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <For each={store.bossRecords}>
                  {(item, idx) => (
                    <TableRow
                      sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                    >
                      <TableCell component="th" scope="row" sx={{ color: item.chaos ? 'red' : 'auto' }}>
                        {item.operation}
                        <Show when={item.chaos}>
                          （混乱）
                        </Show>
                      </TableCell>
                      <TableCell align="right">{calcBossRecordScore(idx())}</TableCell>
                      <TableCell align="center">
                        <Button variant="contained" color="error" onClick={() => removeBossRecord(idx())}>删除</Button>
                      </TableCell>
                    </TableRow>
                  )}
                </For>
              </TableBody>
            </Table>
          </TableContainer>
          <Typography>该部分得分: {calcBossSum()}</Typography>
        </Card>

        {/* ban 人 */}
        <Card sx={{ display: "flex", flexShrink: 0, flexDirection: "column", gap: 1, padding: 2 }}>
          <Typography variant="h6">ban 人</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <For each={store.bannedOperatorRecords}>{(item) => <>
              <Button variant="outlined" color={item.banned ? "success" : "secondary"} onClick={() => {
                toggleBannedOperator(item.operator)
              }}>
                {item.operator}
                <Show when={item.banned}>
                  <span style={{ color: "green" }}>（+{BannedOperatorInfos[item.operator]}）</span>
                </Show>
              </Button>
            </>}</For>
          </Box>
          <Typography>该部分得分: {calcBannedSum()}</Typography>
        </Card>

        {/* 国王套 */}
        <Card sx={{ display: "flex", flexShrink: 0, flexDirection: "column", gap: 1, padding: 2 }}>
          <Typography variant="h6">国王套</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            <For each={store.kingsCollectibleRecords}>{(item) => <>
              <Button variant="outlined" color={item.owned ? "error" : "secondary"} onClick={() => {
                toggleKingsCollectible(item.collectible)
              }}>
                {item.collectible}
              </Button>
            </>}</For>
          </Box>
          <Typography>该部分得分: {calcKingsCollectibleSum()}</Typography>
        </Card>
      </Box>

      {/* 右侧 结算栏 */}
      <Box sx={{ display: "flex", flexDirection: "column", minWidth: 200 }}>
        <Card sx={{ display: "flex", flexDirection: "column", gap: 1, flex: 1, padding: 2 }}>
          <Typography variant="h6" sx={{ paddingBottom: 1 }}>结算</Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1, flex: 1 }}>
            <TextField
              label="藏品数量"
              type="number"
              value={store.collectionsCnt}
              onChange={(_, value) => setStore("collectionsCnt", parseInt(value) || 0)}
              helperText={
                store.collectible == Collectible.DoodleInTheEraOfHope
                  ? <span style={{ color: "green" }}>{store.collectionsCnt} * {collectibleScore()} = {calcCollectionsScore()}</span>
                  : <span style={{ color: "red" }}>无希望时代的涂鸦</span>
              }
            />
            <TextField
              label="击杀隐藏数量"
              type="number"
              value={store.killedHiddenCnt}
              onChange={(_, value) => setStore("killedHiddenCnt", parseInt(value) || 0)}
              helperText={`${store.killedHiddenCnt} * 10 = ${calcHiddenScore()}`}
            />
            <TextField
              label="刷新次数"
              type="number"
              value={store.refreshCnt}
              onChange={(_, value) => setStore("refreshCnt", parseInt(value) || 0)}
              helperText={
                store.refreshCnt <= maxRefreshCnt()
                  ? <span style={{ color: "green" }}>&lt;= {maxRefreshCnt()}</span>
                  : <span style={{ color: "red" }}>{store.refreshCnt - maxRefreshCnt()} x -50 = {calcRefreshScore()}</span>
              }
            />
            <TextField
              label="取钱数量"
              type="number"
              value={store.withdrawCnt}
              onChange={(_, value) => setStore("withdrawCnt", parseInt(value) || 0)}
              sx={{
                color: store.withdrawCnt < 40 ? "green" : "red"
              }}
              helperText={
                store.withdrawCnt <= 40
                  ? <span style={{ color: "green" }}>&lt;= 40</span>
                  : <span style={{ color: "red" }}>{store.withdrawCnt - 40} x -50 = {calcWithdrawScore()}</span>
              }
            />
            <TextField
              label="结算分"
              type="number"
              value={store.score}
              onChange={(_, value) => setStore("score", parseInt(value) || 0)}
              helperText={`${store.score} x 0.5 = ${calcScore()}`}
            />
          </Box>
          <Typography sx={{ fontSize: "1.5rem" }}>总计：{calcTotalSum()}</Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button variant="contained" onClick={() => { setStore({ ...defaultStoreValue }) }}>清零</Button>
            <Button variant="outlined" onClick={async () => {
              let content = JSON.stringify(store)
              console.log(content)
              await invoke("write_json", { content });
            }}>保存</Button>
            <Button variant="outlined" onClick={async () => {
              const content = await invoke<string>("read_json");
              let data = JSON.parse(content);
              console.log(data)
              setStore(data as Store)
            }}>加载</Button>
          </Box>
        </Card>
      </Box>
    </Box>
  </>;
}

export default App;
