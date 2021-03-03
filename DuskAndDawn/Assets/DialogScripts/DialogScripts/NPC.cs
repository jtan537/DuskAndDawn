using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;

public class NPC : MonoBehaviour
{
    public static NPC ActiveNPC { get; private set; }
    public string YarnStartNode { get { return yarnStartNode; } }
    public string Name { get { return npc_name; } }

#pragma warning disable 0649
    [SerializeField] string yarnStartNode = "Start";
    [SerializeField] YarnProgram yarnDialog;
#pragma warning restore 0649

    public GameObject InteractTriggerUI;
    public GameObject textObj;
    public string text;
    public string npc_name;

    private Metadata _metadata;

    private void Start()
    {
        _metadata = GameObject.FindObjectOfType<Metadata>().GetComponent<Metadata>();
        DialogUI.Instance.dialogueRunner.Add(yarnDialog);
        InteractTriggerUI.SetActive(false);
    }

    private void OnTriggerEnter(Collider collision)
    {
        if(collision.CompareTag("Player") && collision.gameObject.name == gameObject.tag  && _metadata.getCurPlayer().name == collision.gameObject.name)
        {
            SetActiveNPC(true);
            textObj.GetComponent<TextMeshProUGUI>().SetText(text);
            InteractTriggerUI.SetActive(true);
        }
    }

    private void OnTriggerStay(Collider collision)
    {
        if (collision.CompareTag("Player") && collision.gameObject.name == gameObject.tag && _metadata.getCurPlayer().name == collision.gameObject.name)
        {
            SetActiveNPC(true);
/*            textObj.GetComponent<TextMeshProUGUI>().SetText(text);
            InteractTriggerUI.SetActive(true);*/
        }
    }

    private void OnTriggerExit(Collider collision)
    {
        if(collision.CompareTag("Player") && collision.gameObject.name == gameObject.tag && _metadata.getCurPlayer().name == collision.gameObject.name)
        {
            SetActiveNPC(false);
            textObj.GetComponent<TextMeshProUGUI>().SetText("");
            InteractTriggerUI.SetActive(false);
        }
    }

    public void deactivateNPC()
    {
        SetActiveNPC(false);
        textObj.GetComponent<TextMeshProUGUI>().SetText("");
        InteractTriggerUI.SetActive(false);
    }

    void SetActiveNPC(bool set)
    {
        ActiveNPC = set ? this : null;
    }
}
