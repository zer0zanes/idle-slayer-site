"use strict";
var SortDirection;
(function (SortDirection) {
    SortDirection[SortDirection["asc"] = 0] = "asc";
    SortDirection[SortDirection["des"] = 1] = "des";
})(SortDirection || (SortDirection = {}));
const sort_direction_to_string = (dir) => {
    switch (dir) {
        case SortDirection.asc:
            return "asc";
        case SortDirection.des:
            return "des";
    }
};
document.addEventListener("DOMContentLoaded", () => {
    setup_random_box_simulation();
    void setup_map_value_area();
    const sortable_headers = document.querySelectorAll(".sortable");
    for (const header of sortable_headers) {
        header.addEventListener("click", change_table_sort);
    }
});
const load_json = (url) => {
    return new Promise((resolve) => {
        const req = new XMLHttpRequest();
        req.onreadystatechange = () => {
            if (req.readyState === 4 && req.status === 200) {
                resolve(JSON.parse(req.responseText));
            }
        };
        req.overrideMimeType("application/json");
        req.open("GET", `./build/data/${url}`, true);
        req.send();
    });
};
const base_enemies = [];
let enemies = {};
let maps = [];
let giants = [];
const map_active_value_result_cells = {};
const map_idle_value_result_cells = {};
let pattern_level_input = null;
let need_for_kill_input = null;
let enemy_invasion_input = null;
let multa_hostibus_input = null;
let bone_rib_whistle_input = null;
let bring_hell_input = null;
let doomed_input = null;
let big_troubles_input = null;
const evolved = {};
const giant_bought = {};
const MAX_PATTERN_LEVEL = 3;
const MIN_PATTERN_LEVEL = 1;
const setup_map_value_area = async () => {
    enemies = await load_json("enemies.json");
    maps = await load_json("maps.json");
    giants = await load_json("giants.json");
    const bonus_index = maps.findIndex((m) => m.name === "Bonus Stage");
    if (bonus_index !== -1) {
        maps.splice(bonus_index, 1);
    }
    const bonus_two_index = maps.findIndex((m) => m.name === "Bonus Stage 2");
    if (bonus_two_index !== -1) {
        maps.splice(bonus_two_index, 1);
    }
    const bonus_special_index = maps.findIndex((m) => m.name === "Special Bonus Stage");
    if (bonus_special_index !== -1) {
        maps.splice(bonus_special_index, 1);
    }
    delete enemies["Soul Goblin"];
    delete enemies["Soul Hobgoblin"];
    delete enemies["Soul Goblin Chief"];
    const options_area = document.getElementById("mapValueOptionsArea");
    const evolutions_list = document.getElementById("mapValueEvolutionsList");
    const giants_list = document.getElementById("mapValueGiantsList");
    const active_results_table = document.getElementById("mapValuesResultsTableActive");
    const idle_results_table = document.getElementById("mapValuesResultsTableIdle");
    if (options_area === null || evolutions_list === null || active_results_table === null || idle_results_table === null || giants_list === null) {
        return;
    }
    for (const [name, enemy] of Object.entries(enemies)) {
        if (enemy.base) {
            let evolved_enemy = enemy;
            do {
                if (evolved_enemy.evolution === undefined) {
                    break;
                }
                const evolved_name = evolved_enemy.evolution;
                evolved_enemy = enemies[evolved_enemy.evolution];
                evolutions_list.appendChild(create_evolution_checkbox(evolved_name, on_evolution_toggle));
            } while (evolved_enemy !== undefined);
            base_enemies.push(enemy);
        }
        evolved[name] = false;
    }
    for (const giant of giants) {
        giants_list.appendChild(create_evolution_checkbox(giant.name, on_giant_toggle));
        giant_bought[giant.name] = false;
    }
    const create_map_row = (table, map, type) => {
        const coins = document.createElement("td");
        const souls = document.createElement("td");
        if (type === "active") {
            map_active_value_result_cells[map.name] = { coins, souls };
        }
        else if (type === "idle") {
            map_idle_value_result_cells[map.name] = { coins, souls };
        }
        const map_row = document.createElement("tr");
        const map_name_cell = document.createElement("td");
        map_name_cell.textContent = map.name;
        map_row.appendChild(map_name_cell);
        map_row.appendChild(coins);
        map_row.appendChild(souls);
        table.appendChild(map_row);
    };
    for (const map of maps) {
        create_map_row(active_results_table, map, "active");
        create_map_row(idle_results_table, map, "idle");
    }
    pattern_level_input = document.querySelector("input[name=maxPatternLevel]");
    if (pattern_level_input !== null) {
        pattern_level_input.value = String(1);
        pattern_level_input.addEventListener("change", () => {
            if (pattern_level_input !== null) {
                const current_pattern_level_value = Number(pattern_level_input.value);
                if (isNaN(current_pattern_level_value)) {
                    pattern_level_input.value = String(MIN_PATTERN_LEVEL);
                }
                if (current_pattern_level_value > MAX_PATTERN_LEVEL) {
                    pattern_level_input.value = String(MAX_PATTERN_LEVEL);
                }
                else if (current_pattern_level_value < MIN_PATTERN_LEVEL) {
                    pattern_level_input.value = String(MIN_PATTERN_LEVEL);
                }
            }
            calculate_map_values();
        });
    }
    need_for_kill_input = document.querySelector("input[name=needForKill]");
    enemy_invasion_input = document.querySelector("input[name=enemyInvasion]");
    multa_hostibus_input = document.querySelector("input[name=multaHostibus]");
    bone_rib_whistle_input = document.querySelector("input[name=boneRibWhistle]");
    bring_hell_input = document.querySelector("input[name=bringHell]");
    doomed_input = document.querySelector("input[name=doomed]");
    big_troubles_input = document.querySelector("input[name=bigTroubles]");
    calculate_map_values();
};
const calculate_map_values = () => {
    calculate_map_values_active();
    calculate_map_values_idle();
};
const calculate_map_values_active = () => {
    var _a;
    if (pattern_level_input === null) {
        return;
    }
    const pattern_level = Number(pattern_level_input.value);
    const giants_chance_modifier = (big_troubles_input === null || big_troubles_input === void 0 ? void 0 : big_troubles_input.checked) ? 15 : 0;
    const enemy_spawn_chance_bonus = ((need_for_kill_input === null || need_for_kill_input === void 0 ? void 0 : need_for_kill_input.checked) ? 30 : 0) +
        ((enemy_invasion_input === null || enemy_invasion_input === void 0 ? void 0 : enemy_invasion_input.checked) ? 50 : 0) +
        ((multa_hostibus_input === null || multa_hostibus_input === void 0 ? void 0 : multa_hostibus_input.checked) ? 50 : 0) +
        ((bone_rib_whistle_input === null || bone_rib_whistle_input === void 0 ? void 0 : bone_rib_whistle_input.checked) ? 40 : 0) +
        ((bring_hell_input === null || bring_hell_input === void 0 ? void 0 : bring_hell_input.checked) ? 20 : 0) +
        ((doomed_input === null || doomed_input === void 0 ? void 0 : doomed_input.checked) ? 30 : 0);
    //assuming no boosting for now. It will just scale everything linearly anyway.
    const player_speed = 4; //distance units/second
    //distance units per giant
    const average_giant_distance = (250 / (giants_chance_modifier / 100 + 1) + 450 / (giants_chance_modifier / 100 + 1)) / 2; //in distance units
    const giants_per_second = player_speed / average_giant_distance;
    //distance units per pattern
    const average_pattern_distance = (60 / (enemy_spawn_chance_bonus / 100 + 1) + 90 / (enemy_spawn_chance_bonus / 100 + 1)) / 2; //in distance units
    const patterns_per_second = player_speed / average_pattern_distance;
    for (const map of maps) {
        let souls = 0;
        let coins = 0;
        for (const pattern of map.patterns) {
            if (pattern.level > pattern_level) {
                continue;
            }
            for (const enemy_name of pattern.enemies) {
                let enemy_data = enemies[enemy_name];
                if (enemy_data === undefined) {
                    console.log(`No enemy data found for ${enemy_name}, skipping enemy in pattern in ${map.name}`);
                    continue;
                }
                //find the highest unlocked evolution for this enemy
                while (enemy_data.evolution !== undefined && evolved[enemy_data.evolution]) {
                    if (enemies[enemy_data.evolution] === undefined) {
                        console.log(`Enemy evolution ${enemy_data.evolution} not found, staying with ${JSON.stringify(enemy_data)}`);
                        break;
                    }
                    else {
                        enemy_data = enemies[enemy_data.evolution];
                    }
                }
                souls += enemy_data.souls;
                coins += enemy_data.coins;
            }
        }
        const average_pattern_coins = coins / map.patterns.length;
        const average_pattern_souls = souls / map.patterns.length;
        const pattern_coins_per_second = patterns_per_second * average_pattern_coins;
        const pattern_souls_per_second = patterns_per_second * average_pattern_souls;
        //Add in the giants' average cps/sps to what we calculated
        const { giant_coins_per_second, giant_souls_per_second } = giants
            .filter((g) => g.maps.includes(map.name) && giant_bought[g.name])
            .map((g) => ({ giant_coins_per_second: giants_per_second * g.coins, giant_souls_per_second: giants_per_second * g.souls }))
            .reduce((acc, curr) => {
            acc.giant_coins_per_second += curr.giant_coins_per_second;
            acc.giant_souls_per_second += curr.giant_souls_per_second;
            return acc;
        }, { giant_coins_per_second: 0, giant_souls_per_second: 0 });
        map_active_value_result_cells[map.name].coins.innerText = String((pattern_coins_per_second + giant_coins_per_second).toFixed(2));
        map_active_value_result_cells[map.name].souls.innerText = String((pattern_souls_per_second + giant_souls_per_second).toFixed(2));
    }
    const table = (_a = document.querySelector("#mapValuesResultsTableActive")) === null || _a === void 0 ? void 0 : _a.closest("table");
    if (table !== null && table !== undefined) {
        update_table_sort(table);
    }
};
const calculate_map_values_idle = () => {
    //pattern level doesn't matter, it's all about what enemies are capable of spawning in a map
    var _a;
    for (const map of maps) {
        const map_enemies = new Set();
        let coins = 0;
        let souls = 0;
        for (const pattern of map.patterns) {
            for (const enemy_name of pattern.enemies) {
                map_enemies.add(enemy_name);
            }
        }
        for (const enemy_name of Array.from(map_enemies)) {
            let enemy_data = enemies[enemy_name];
            if (enemy_data === undefined) {
                console.log(`No enemy data found for ${enemy_name}, skipping enemy in pattern in ${map.name}`);
                continue;
            }
            //find the highest unlocked evolution for this enemy
            while (enemy_data.evolution !== undefined && evolved[enemy_data.evolution]) {
                if (enemies[enemy_data.evolution] === undefined) {
                    console.log(`Enemy evolution ${enemy_data.evolution} not found, staying with ${JSON.stringify(enemy_data)}`);
                    break;
                }
                else {
                    enemy_data = enemies[enemy_data.evolution];
                }
            }
            coins += enemy_data.coins;
            souls += enemy_data.souls;
        }
        map_idle_value_result_cells[map.name].coins.innerText = String((coins / map_enemies.size).toFixed(2));
        map_idle_value_result_cells[map.name].souls.innerText = String((souls / map_enemies.size).toFixed(2));
    }
    const table = (_a = document.querySelector("#mapValuesResultsTableIdle")) === null || _a === void 0 ? void 0 : _a.closest("table");
    if (table !== null && table !== undefined) {
        update_table_sort(table);
    }
};
const create_evolution_checkbox = (name, changeCallback) => {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = name.replace(/ /g, "_");
    checkbox.classList.add("bonus_checkbox");
    checkbox.addEventListener("change", changeCallback);
    const label = document.createElement("label");
    label.textContent = name;
    label.htmlFor = name;
    const container = document.createElement("li");
    container.appendChild(label);
    container.appendChild(checkbox);
    return container;
};
const find_evolution_base = (enemy_name) => {
    const enemy = enemies[enemy_name.replace(/_/g, " ")];
    if (enemy === undefined) {
        throw new Error(`Enemy ${enemy_name} is undefined! Cannot find base for this.`);
    }
    if (enemy.base) {
        return enemy;
    }
    const previous_enemy = Object.entries(enemies).find(([_, e]) => e.evolution === enemy_name.replace(/_/g, " "));
    if (previous_enemy === undefined) {
        throw new Error(`No enemy evolves into ${enemy_name}!`);
    }
    return find_evolution_base(previous_enemy[0]);
};
const on_giant_toggle = (event) => {
    const giant_name = event.currentTarget.name.replace(/_/g, " ");
    giant_bought[giant_name] = !giant_bought[giant_name];
    calculate_map_values();
};
const on_evolution_toggle = (event) => {
    const enemy_name = event.currentTarget.name.replace(/_/g, " ");
    evolved[enemy_name] = !evolved[enemy_name];
    let enemy = find_evolution_base(enemy_name);
    //make sure all evolutions are checked that are before this
    const is_checked = evolved[enemy_name];
    let enemy_encountered = false;
    do {
        if (enemy.evolution === undefined) {
            break;
        }
        if ((is_checked && !enemy_encountered) || (!is_checked && enemy_encountered)) {
            const checkbox = document.querySelector(`input[name=${enemy.evolution.replace(/ /g, "_")}]`);
            if (checkbox !== null) {
                checkbox.checked = evolved[enemy_name];
            }
            evolved[enemy.evolution] = evolved[enemy_name];
        }
        if (enemy.evolution === enemy_name) {
            enemy_encountered = true;
        }
        enemy = enemies[enemy.evolution];
        // eslint-disable-next-line no-constant-condition
    } while (true);
    calculate_map_values();
};
const change_table_sort = (event) => {
    var _a, _b;
    const header = event.currentTarget;
    const current_dir = header.classList.contains(sort_direction_to_string(SortDirection.des)) ? SortDirection.des : SortDirection.asc;
    const new_dir = current_dir === SortDirection.asc ? SortDirection.des : SortDirection.asc;
    const header_name = header.textContent;
    const all_headers = (_a = header.closest("tr")) === null || _a === void 0 ? void 0 : _a.childNodes;
    if (all_headers === undefined) {
        return;
    }
    let header_idx = -1;
    let count = 0;
    for (const header_element of all_headers) {
        if (header_element.nodeType === 1) {
            header_element.classList.remove(sort_direction_to_string(SortDirection.asc), sort_direction_to_string(SortDirection.des));
            if (header_element.textContent === header_name) {
                header_idx = count;
            }
            count++;
        }
    }
    header.classList.add(sort_direction_to_string(new_dir));
    if (header_idx === -1) {
        return;
    }
    const table = header.closest("table");
    const t_body = (_b = table === null || table === void 0 ? void 0 : table.getElementsByTagName("tbody")) === null || _b === void 0 ? void 0 : _b.item(0);
    if (t_body === null || t_body === undefined) {
        return;
    }
    sort_table_inner(t_body, header_idx, new_dir);
};
const update_table_sort = (table) => {
    //find header indicating sort
    const headers = table.querySelectorAll("th");
    let idx = 0;
    let header_idx = -1;
    let sort_dir = SortDirection.des;
    for (const header of headers) {
        if (header.nodeType === 1) {
            if (header.classList.contains(sort_direction_to_string(SortDirection.des))) {
                sort_dir = SortDirection.des;
                header_idx = idx;
                break;
            }
            if (header.classList.contains(sort_direction_to_string(SortDirection.asc))) {
                sort_dir = SortDirection.asc;
                header_idx = idx;
                break;
            }
            idx++;
        }
    }
    const t_body = table.querySelector("tbody");
    if (t_body === null || header_idx === -1) {
        return;
    }
    sort_table_inner(t_body, header_idx, sort_dir);
};
const sort_table_inner = (t_body, header_idx, dir) => {
    const rows = [];
    for (const element of t_body.childNodes) {
        if (element.nodeType == 1) {
            rows.push(element);
        }
    }
    rows.sort((a, b) => {
        const a_sort_value = Number(a.childNodes[header_idx].textContent);
        const b_sort_value = Number(b.childNodes[header_idx].textContent);
        if (!isNaN(a_sort_value) && !isNaN(b_sort_value)) {
            switch (dir) {
                case SortDirection.asc:
                    return a_sort_value - b_sort_value;
                case SortDirection.des:
                    return b_sort_value - a_sort_value;
            }
        }
        else {
            //fall back to string comparison
            const a_text = a.childNodes[header_idx].textContent;
            const b_text = b.childNodes[header_idx].textContent;
            switch (dir) {
                case SortDirection.asc:
                    if (a_text !== null && b_text !== null) {
                        return a_text.localeCompare(b_text);
                    }
                    if (a_text === null && b_text === null) {
                        return 0;
                    }
                    else if (a_text === null) {
                        return 1;
                    }
                    else {
                        return -1;
                    }
                case SortDirection.des:
                    if (a_text !== null && b_text !== null) {
                        return b_text.localeCompare(a_text);
                    }
                    if (a_text === null && b_text === null) {
                        return 0;
                    }
                    else if (a_text === null) {
                        return -1;
                    }
                    else {
                        return 1;
                    }
            }
        }
    });
    for (const row of rows) {
        t_body.appendChild(row);
    }
};
const setup_random_box_simulation = () => {
    //enumerate options
    const options_area = document.getElementById("randomBoxOptionsArea");
    const results_table = document.getElementById("randomBoxResultsTable");
    if (options_area === null || results_table === null) {
        return;
    }
    for (const bonus of random_box_bonuses) {
        if (bonus.toggleable) {
            options_area.appendChild(create_random_box_checkbox(bonus));
        }
        const result_cell = document.createElement("td");
        random_box_result_cells[bonus.name] = result_cell;
        const bonus_row = document.createElement("tr");
        const name_cell = document.createElement("td");
        name_cell.textContent = bonus.name;
        bonus_row.appendChild(name_cell);
        bonus_row.appendChild(result_cell);
        results_table.appendChild(bonus_row);
    }
    const divinity_checkbox = document.createElement("input");
    divinity_checkbox.type = "checkbox";
    divinity_checkbox.checked = random_box_reduce_found_coins;
    divinity_checkbox.addEventListener("change", () => {
        random_box_reduce_found_coins = divinity_checkbox.checked;
        get_box_probabilities();
    });
    divinity_checkbox.name = "divinity_checkbox";
    const label = document.createElement("label");
    label.textContent = "Less Coins More Fun Divinity Bought";
    label.htmlFor = "divinity_checkbox";
    const container = document.createElement("div");
    container.appendChild(label);
    container.appendChild(divinity_checkbox);
    options_area.appendChild(container);
    get_box_probabilities();
};
//todo: load random_box_bonuses from a json file
const random_box_bonuses = [
    {
        chance: 1,
        name: "Found Coins",
        toggleable: false,
    },
    {
        chance: 0.3,
        name: "Frenzy",
        toggleable: false,
    },
    {
        chance: 0.04,
        name: "Equipment Bonus",
        toggleable: false,
    },
    {
        chance: 0.01,
        name: "OMG",
        toggleable: false,
    },
    {
        chance: 0.05,
        name: "Coin Value",
        toggleable: false,
    },
    {
        chance: 0.1,
        name: "Dual Randomness",
        toggleable: true,
    },
    {
        chance: 0.12,
        name: "Gemstone Rush",
        toggleable: true,
    },
    {
        chance: 0.2,
        name: "CpS Multiplier",
        toggleable: false,
    },
    {
        chance: 0.25,
        name: "Horde",
        toggleable: true,
    },
    {
        chance: 0.12,
        name: "Increase Souls",
        toggleable: true,
    },
];
let random_box_reduce_found_coins = false;
//map from bonus name to toggled state, if toggleable
const toggled = random_box_bonuses
    .filter((b) => b.toggleable)
    .reduce((accumulator, curr) => {
    accumulator[curr.name] = false;
    return accumulator;
}, {});
const create_random_box_checkbox = (bonus) => {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.name = bonus.name;
    checkbox.classList.add("bonus_checkbox");
    checkbox.addEventListener("change", on_bonus_toggle);
    const label = document.createElement("label");
    label.textContent = bonus.name;
    if (bonus.name === "Horde") {
        label.textContent = "Map has flying enemies, or you have Mega Horde";
    }
    label.htmlFor = bonus.name;
    const container = document.createElement("div");
    container.appendChild(label);
    container.appendChild(checkbox);
    return container;
};
/** map of bonus name to its result cell */
const random_box_result_cells = {};
/**
 * Called on a bonus's checkbox being changed
 * @param event
 */
const on_bonus_toggle = (event) => {
    const bonus_name = event.currentTarget.name;
    if (toggled[bonus_name] === undefined) {
        toggled[bonus_name] = true;
    }
    else {
        toggled[bonus_name] = !toggled[bonus_name];
    }
    get_box_probabilities();
};
const sort_random_box_table = () => {
    const table = document.getElementById("randomBoxResultsTable");
    if (table === null) {
        return;
    }
    const store = [];
    for (let i = 0, len = table.rows.length; i < len; i++) {
        const row = table.rows[i];
        if (row.cells[1].textContent === null) {
            continue;
        }
        const sort_value = parseFloat(row.cells[1].textContent);
        store.push([sort_value, row]);
    }
    store.sort((a, b) => b[0] - a[0]);
    for (const [_, row] of store) {
        table.appendChild(row);
    }
};
/**
 * Credit to Scion#7777 from the IdleSlayer discord for this
 */
class Distribution {
    constructor() {
        this.dist = {};
        this.empty = 1;
        for (const box of random_box_bonuses) {
            this.dist[box.name] = 0;
        }
        this.update();
    }
    update() {
        this.empty = 1;
        for (const box of random_box_bonuses) {
            this.empty -= this.dist[box.name];
        }
    }
    add(other) {
        for (const box of random_box_bonuses) {
            this.dist[box.name] += other.dist[box.name];
        }
    }
    divide(scalar) {
        for (const box of random_box_bonuses) {
            this.dist[box.name] /= scalar;
        }
    }
    normalize() {
        this.divide(1 - this.empty);
    }
}
let distribution_cache = {};
/**
 * Calculate the distribution of bonuses from the random box.
 *
 * Credit to Scion#7777 from the IdleSlayer discord for this
 */
const calculate_distribution = (box_set) => {
    const set_names = box_set.map((box) => box.name).join("");
    if (distribution_cache[set_names] != undefined) {
        return distribution_cache[set_names];
    }
    const new_dist = new Distribution();
    // 1. If set has only 1 element, calculate it.
    if (box_set.length === 1) {
        for (const out of box_set) {
            new_dist.dist[out.name] = out.chance;
            new_dist.update();
        }
        distribution_cache[set_names] = new_dist;
        return new_dist;
    }
    // 2. Otherwise, calculate it in function of the subsets
    //
    // Idea: take each element, pretend it's the last one in the shuffle.
    // The resulting distribution is the same as that of the reduced set, except
    // probability of the last element is its base probability * reduced.empty.
    //
    // Calculating the average after making each element of the set be the last
    // gives the final distribution.
    for (const [last_idx, last] of box_set.entries()) {
        const reduced_set = [...box_set];
        reduced_set.splice(last_idx, 1);
        const reduced = calculate_distribution(reduced_set);
        new_dist.add(reduced);
        new_dist.dist[last.name] += last.chance * reduced.empty;
    }
    new_dist.divide(box_set.length);
    new_dist.update();
    distribution_cache[set_names] = new_dist;
    return new_dist;
};
/**
 * Get the probabilities of getting random boxes, and update the table with the probabilities.
 */
const get_box_probabilities = () => {
    const filtered_boxes = random_box_bonuses.filter((bonus) => toggled[bonus.name] === undefined || toggled[bonus.name]);
    const idx = filtered_boxes.findIndex((box) => box.name === "Found Coins");
    if (random_box_reduce_found_coins) {
        filtered_boxes[idx].chance = 0.9;
    }
    else {
        filtered_boxes[idx].chance = 1;
    }
    const distribution = calculate_distribution(filtered_boxes);
    distribution.normalize();
    for (const [key, probability] of Object.entries(distribution.dist)) {
        random_box_result_cells[key].textContent = `${(probability * 100).toFixed(2)}%`;
    }
    //clear cache
    distribution_cache = {};
    sort_random_box_table();
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FsYy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9jYWxjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxJQUFLLGFBR0o7QUFIRCxXQUFLLGFBQWE7SUFDakIsK0NBQUcsQ0FBQTtJQUNILCtDQUFHLENBQUE7QUFDSixDQUFDLEVBSEksYUFBYSxLQUFiLGFBQWEsUUFHakI7QUFFRCxNQUFNLHdCQUF3QixHQUFHLENBQUMsR0FBa0IsRUFBaUIsRUFBRTtJQUN0RSxRQUFRLEdBQUcsRUFBRTtRQUNaLEtBQUssYUFBYSxDQUFDLEdBQUc7WUFDckIsT0FBTyxLQUFLLENBQUM7UUFDZCxLQUFLLGFBQWEsQ0FBQyxHQUFHO1lBQ3JCLE9BQU8sS0FBSyxDQUFDO0tBQ2Q7QUFDRixDQUFDLENBQUM7QUFFRixRQUFRLENBQUMsZ0JBQWdCLENBQUMsa0JBQWtCLEVBQUUsR0FBRyxFQUFFO0lBQ2xELDJCQUEyQixFQUFFLENBQUM7SUFDOUIsS0FBSyxvQkFBb0IsRUFBRSxDQUFDO0lBQzVCLE1BQU0sZ0JBQWdCLEdBQUcsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ2hFLEtBQUssTUFBTSxNQUFNLElBQUksZ0JBQWdCLEVBQUU7UUFDdEMsTUFBTSxDQUFDLGdCQUFnQixDQUFDLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0tBQ3BEO0FBQ0YsQ0FBQyxDQUFDLENBQUM7QUFFSCxNQUFNLFNBQVMsR0FBRyxDQUFJLEdBQVcsRUFBYyxFQUFFO0lBQ2hELE9BQU8sSUFBSSxPQUFPLENBQUMsQ0FBQyxPQUFPLEVBQUUsRUFBRTtRQUM5QixNQUFNLEdBQUcsR0FBRyxJQUFJLGNBQWMsRUFBRSxDQUFDO1FBQ2pDLEdBQUcsQ0FBQyxrQkFBa0IsR0FBRyxHQUFHLEVBQUU7WUFDN0IsSUFBSSxHQUFHLENBQUMsVUFBVSxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUMsTUFBTSxLQUFLLEdBQUcsRUFBRTtnQkFDL0MsT0FB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