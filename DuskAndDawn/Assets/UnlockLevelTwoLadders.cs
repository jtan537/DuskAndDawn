using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;

public class UnlockLevelTwoLadders : MonoBehaviour
{
    Metadata metadata;
    [SerializeField]
    Teleport dawnLadder, duskLadder;

    public GameObject InteractTriggerUI;
    public GameObject textObj;

    bool unlockedLadders = false;
    // Start is called before the first frame update
    void Start()
    {
        metadata = GameObject.Find("Metadata").GetComponent<Metadata>();
        dawnLadder.unlockedLadder = false;
        duskLadder.unlockedLadder = false;
    }

    // Update is called once per frame
    void Update()
    {
        if (metadata.duskGemsPickedUp >= 2 && metadata.dawnGemsPickedUp >= 2 && !unlockedLadders)
        {


            dawnLadder.unlockedLadder = true;
            duskLadder.unlockedLadder = true;

            metadata.getCurPlayer().GetComponent<NPCInteract>().Interact("UnlockLevel2Ladder");
            textObj.GetComponent<TextMeshProUGUI>().SetText("");
            InteractTriggerUI.SetActive(false);

            unlockedLadders = true;
        }
    }
}
