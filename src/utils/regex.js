module.exports = {
    /**
     * Get a treafik url from docker swarm labels
     *
     * @param labels
     * @return {boolean | string}
     */
    getTraefikUrlFromLabels: (labels) => {
        const labelKeys = Object.keys(labels);
        let url = false;

        for(let item = 0; item < labelKeys.length; item++) {
            const label = labels[labelKeys[item]];

            if(label.match(/Host\(`(.*)`\)/)) {
                if(label.match(/Host\(`(.*)`\)/)[1]) {
                    url = label.match(/Host\(`(.*)`\)/)[1];
                }
            }
        }

        return url;
    }
};
