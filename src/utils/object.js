module.exports = {
    /**
     * Converts a memory object to task objects
     *
     * @param memory
     * @return {{}}
     */
    convertMemoryToTasksObject: (memory) => {
        const keys = Object.keys(memory);
        let newObject = {};

        for(let item = 0; item < keys.length; item++) {
            const memoryItem = memory[keys[item]];
            newObject = {...newObject, ... memoryItem};
        }

        return newObject;
    }
};
