package model

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"os"

	"github.com/csunibo/informabot/utils"
	"github.com/mitchellh/mapstructure"
	"golang.org/x/exp/slices"
)

const groupsPath = "./json/groups.json"

func ParseAutoReplies() ([]AutoReply, error) {
	jsonFile, err := os.Open("./json/autoreply.json")
	if err != nil {
		log.Println(err)
		return nil, err
	}
	defer jsonFile.Close()

	byteValue, _ := ioutil.ReadAll(jsonFile)

	var autoreplies []AutoReply
	json.Unmarshal(byteValue, &autoreplies)

	return autoreplies, nil
}

func ParseSettings() (SettingsStruct, error) {
	jsonFile, err := os.Open("./json/settings.json")
	if err != nil {
		log.Println(err)
		return SettingsStruct{}, err
	}
	defer jsonFile.Close()

	byteValue, _ := ioutil.ReadAll(jsonFile)

	var settings SettingsStruct
	json.Unmarshal(byteValue, &settings)

	return settings, nil
}

func ParseActions() ([]Action, error) {
	jsonFile, err := os.Open("./json/actions.json")
	if err != nil {
		log.Println(err)
		return nil, err
	}
	defer jsonFile.Close()

	byteValue, _ := ioutil.ReadAll(jsonFile)
	return ParseActionsBytes(byteValue)
}

func ParseActionsBytes(bytes []byte) ([]Action, error) {
	var mapData map[string]interface{}
	err := json.Unmarshal(bytes, &mapData)
	if err != nil {
		log.Println(err)
	}

	var actions []Action
	for key, value := range mapData {
		action := GetActionFromType(key, value.(map[string]interface{})["type"].(string))
		err := mapstructure.Decode(value, &action)
		if err != nil {
			return nil, err
		}

		actions = append(actions, action)
	}

	slices.SortFunc(actions, func(a, b Action) int {
		if a.Name < b.Name {
			return -1
		} else if a.Name > b.Name {
			return 1
		} else {
			return 0
		}
	})

	return actions, nil
}

func ParseMemeList() ([]Meme, error) {
	jsonFile, err := os.Open("./json/memes.json")
	if err != nil {
		log.Println(err)
		return nil, err
	}
	defer jsonFile.Close()

	byteValue, _ := ioutil.ReadAll(jsonFile)

	var mapData map[string]interface{}
	json.Unmarshal(byteValue, &mapData)

	var memes []Meme
	for key, value := range mapData {
		meme := Meme{
			Name: key,
			Text: value.(string),
		}
		memes = append(memes, meme)
	}

	return memes, nil
}

func ParseOrCreateGroups() (GroupsStruct, error) {
	jsonFile, err := os.Open(groupsPath)
	if err != nil {
		jsonFile, err = os.Create(groupsPath)
		if err != nil {
			log.Println(err)
			return nil, err
		}
	}
	defer jsonFile.Close()

	byteValue, _ := ioutil.ReadAll(jsonFile)

	var groups GroupsStruct
	json.Unmarshal(byteValue, &groups)

	if groups == nil {
		groups = make(GroupsStruct)
	}

	return groups, nil
}

func SaveGroups() error {
	return utils.WriteJSONFile(groupsPath, Groups)
}
